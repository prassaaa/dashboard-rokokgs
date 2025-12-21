<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\StockDTO;
use App\Exceptions\InsufficientStockException;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Collection;

class StockService extends BaseService
{
    /**
     * Get stock by branch.
     */
    public function getByBranch(int $branchId): Collection
    {
        return Stock::with(['product.productCategory', 'branch'])
            ->where('branch_id', $branchId)
            ->orderBy('quantity', 'asc')
            ->get();
    }

    /**
     * Get stock by product.
     */
    public function getByProduct(int $productId): Collection
    {
        return Stock::with('branch')
            ->where('product_id', $productId)
            ->orderBy('quantity', 'desc')
            ->get();
    }

    /**
     * Get or create stock record.
     */
    public function getOrCreate(int $productId, int $branchId): Stock
    {
        return Stock::firstOrCreate(
            [
                'product_id' => $productId,
                'branch_id' => $branchId,
            ],
            [
                'quantity' => 0,
                'minimum_stock' => 0,
            ]
        );
    }

    /**
     * Update stock quantity.
     */
    public function updateQuantity(int $productId, int $branchId, int $quantity): Stock
    {
        return $this->executeInTransaction(function () use ($productId, $branchId, $quantity) {
            $stock = $this->getOrCreate($productId, $branchId);
            $oldQuantity = $stock->quantity;

            $stock->quantity = $quantity;
            $stock->save();

            $this->logAction('Stock quantity updated', [
                'product_id' => $productId,
                'branch_id' => $branchId,
                'old_quantity' => $oldQuantity,
                'new_quantity' => $quantity,
            ]);

            return $stock;
        });
    }

    /**
     * Add stock (incoming).
     */
    public function addStock(
        int $productId,
        int $branchId,
        int $quantity,
        string $type = 'in',
        ?string $notes = null
    ): Stock {
        return $this->executeInTransaction(function () use ($productId, $branchId, $quantity, $type, $notes) {
            $stock = $this->getOrCreate($productId, $branchId);
            $stock->quantity += $quantity;
            $stock->save();

            // Record stock movement
            StockMovement::create([
                'reference_number' => $this->generateReferenceNumber(),
                'product_id' => $productId,
                'to_branch_id' => $branchId,
                'type' => $type,
                'quantity' => $quantity,
                'notes' => $notes,
                'created_by' => auth()->id(),
            ]);

            $this->logAction('Stock added', [
                'product_id' => $productId,
                'branch_id' => $branchId,
                'quantity' => $quantity,
                'type' => $type,
            ]);

            return $stock->fresh();
        });
    }

    /**
     * Reduce stock (outgoing).
     *
     * @throws InsufficientStockException
     */
    public function reduceStock(
        int $productId,
        int $branchId,
        int $quantity,
        string $type = 'out',
        ?string $notes = null
    ): Stock {
        return $this->executeInTransaction(function () use ($productId, $branchId, $quantity, $type, $notes) {
            $stock = $this->getOrCreate($productId, $branchId);
            $product = Product::find($productId);

            // Check if sufficient stock available
            if ($stock->quantity < $quantity) {
                throw new InsufficientStockException(
                    $product->name,
                    $quantity,
                    $stock->quantity
                );
            }

            $stock->quantity -= $quantity;
            $stock->save();

            // Record stock movement
            StockMovement::create([
                'reference_number' => $this->generateReferenceNumber(),
                'product_id' => $productId,
                'from_branch_id' => $branchId,
                'type' => $type,
                'quantity' => $quantity,
                'notes' => $notes,
                'created_by' => auth()->id(),
            ]);

            $this->logAction('Stock reduced', [
                'product_id' => $productId,
                'branch_id' => $branchId,
                'quantity' => $quantity,
                'type' => $type,
            ]);

            return $stock->fresh();
        });
    }

    /**
     * Transfer stock between branches.
     *
     * @throws InsufficientStockException
     */
    public function transferStock(
        int $productId,
        int $fromBranchId,
        int $toBranchId,
        int $quantity,
        ?string $notes = null
    ): array {
        return $this->executeInTransaction(function () use ($productId, $fromBranchId, $toBranchId, $quantity, $notes) {
            $fromStock = $this->getOrCreate($productId, $fromBranchId);
            $toStock = $this->getOrCreate($productId, $toBranchId);
            $product = Product::find($productId);

            // Check if sufficient stock available in source branch
            if ($fromStock->quantity < $quantity) {
                throw new InsufficientStockException(
                    $product->name,
                    $quantity,
                    $fromStock->quantity
                );
            }

            // Reduce from source
            $fromStock->quantity -= $quantity;
            $fromStock->save();

            // Add to destination
            $toStock->quantity += $quantity;
            $toStock->save();

            // Record stock movement
            StockMovement::create([
                'reference_number' => $this->generateReferenceNumber(),
                'product_id' => $productId,
                'from_branch_id' => $fromBranchId,
                'to_branch_id' => $toBranchId,
                'type' => 'transfer',
                'quantity' => $quantity,
                'notes' => $notes,
                'created_by' => auth()->id(),
            ]);

            $this->logAction('Stock transferred', [
                'product_id' => $productId,
                'from_branch_id' => $fromBranchId,
                'to_branch_id' => $toBranchId,
                'quantity' => $quantity,
            ]);

            return [
                'from_stock' => $fromStock->fresh(),
                'to_stock' => $toStock->fresh(),
            ];
        });
    }

    /**
     * Get low stock alerts.
     */
    public function getLowStockAlerts(?int $branchId = null): Collection
    {
        $query = Stock::with(['product', 'branch'])
            ->whereColumn('quantity', '<=', 'minimum_stock');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->orderBy('quantity', 'asc')->get();
    }

    /**
     * Perform stock opname (physical stock check).
     */
    public function stockOpname(int $branchId, array $stockData): Collection
    {
        return $this->executeInTransaction(function () use ($branchId, $stockData) {
            $adjustments = collect();

            foreach ($stockData as $item) {
                $stock = $this->getOrCreate($item['product_id'], $branchId);
                $systemQuantity = $stock->quantity;
                $physicalQuantity = $item['physical_quantity'];
                $difference = $physicalQuantity - $systemQuantity;

                if ($difference !== 0) {
                    // Record adjustment
                    StockMovement::create([
                        'reference_number' => $this->generateReferenceNumber(),
                        'product_id' => $item['product_id'],
                        'from_branch_id' => $difference < 0 ? $branchId : null,
                        'to_branch_id' => $difference > 0 ? $branchId : null,
                        'type' => 'adjustment',
                        'quantity' => abs($difference),
                        'notes' => "Stock Opname: System ({$systemQuantity}) vs Physical ({$physicalQuantity})",
                        'created_by' => auth()->id(),
                    ]);

                    // Update stock
                    $stock->quantity = $physicalQuantity;
                    $stock->save();

                    $adjustments->push([
                        'product_id' => $item['product_id'],
                        'system_quantity' => $systemQuantity,
                        'physical_quantity' => $physicalQuantity,
                        'difference' => $difference,
                    ]);
                }
            }

            $this->logAction('Stock opname completed', [
                'branch_id' => $branchId,
                'adjustments_count' => $adjustments->count(),
            ]);

            return $adjustments;
        });
    }

    /**
     * Generate reference number for stock movement.
     */
    private function generateReferenceNumber(): string
    {
        $prefix = 'STK';
        $date = now()->format('Ymd');
        $random = strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 6));

        return "{$prefix}-{$date}-{$random}";
    }
}
