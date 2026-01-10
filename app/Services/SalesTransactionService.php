<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\SalesTransactionDTO;
use App\Exceptions\BusinessException;
use App\Exceptions\InsufficientStockException;
use App\Exceptions\UnauthorizedActionException;
use App\Models\Product;
use App\Models\SalesTransaction;
use App\Models\SalesTransactionItem;
use App\Models\Stock;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SalesTransactionService extends BaseService
{
    public function __construct(private readonly StockService $stockService)
    {
    }

    /**
     * Get paginated transactions.
     */
    public function getPaginated(
        int $perPage = 15,
        ?int $branchId = null,
        ?int $salesId = null,
        ?string $status = null,
        ?string $startDate = null,
        ?string $endDate = null
    ): LengthAwarePaginator {
        $query = SalesTransaction::with(['branch', 'sales', 'items.product']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($salesId) {
            $query->where('sales_id', $salesId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($startDate) {
            $query->whereDate('transaction_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('transaction_date', '<=', $endDate);
        }

        return $query->orderBy('transaction_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get transaction by ID.
     */
    public function getById(int $id): SalesTransaction
    {
        return $this->findOrFail(SalesTransaction::class, $id);
    }

    /**
     * Create new transaction.
     *
     * @throws InsufficientStockException
     * @throws BusinessException
     */
    public function create(SalesTransactionDTO $dto): SalesTransaction
    {
        return $this->executeInTransaction(function () use ($dto) {
            // Validate stock availability for all items
            $this->validateStockAvailability($dto);

            // Calculate totals
            $subtotal = 0;
            $items = [];

            foreach ($dto->items as $item) {
                $product = Product::find($item['product_id']);
                $itemTotal = $item['quantity'] * $item['price'];
                $subtotal += $itemTotal;

                $items[] = [
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $item['discount'] ?? 0,
                    'subtotal' => $itemTotal - ($item['discount'] ?? 0),
                ];
            }

            $discount = $dto->discount ?? 0;
            $total = $subtotal - $discount;

            // Create transaction
            $transaction = SalesTransaction::create([
                'transaction_number' => $dto->transaction_number ?? $this->generateTransactionNumber(),
                'transaction_date' => today(),
                'branch_id' => $dto->branch_id,
                'sales_id' => $dto->sales_id,
                'area_id' => $dto->area_id,
                'customer_name' => $dto->customer_name,
                'customer_phone' => $dto->customer_phone,
                'customer_address' => $dto->customer_address,
                'latitude' => $dto->latitude,
                'longitude' => $dto->longitude,
                'proof_photo' => $dto->proof_photo,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'payment_method' => $dto->payment_method,
                'status' => $dto->status,
                'notes' => $dto->notes,
            ]);

            // Create transaction items and reduce stock
            foreach ($items as $item) {
                SalesTransactionItem::create([
                    'sales_transaction_id' => $transaction->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $item['discount'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Reduce stock
                $this->stockService->reduceStock(
                    $item['product_id'],
                    $dto->branch_id,
                    $item['quantity'],
                    'sale',
                    "Sales Transaction: {$transaction->transaction_number}"
                );
            }

            $this->logAction('Sales transaction created', [
                'transaction_id' => $transaction->id,
                'transaction_number' => $transaction->transaction_number,
                'total' => $total,
            ]);

            return $transaction->fresh(['items.product', 'branch', 'sales']);
        });
    }

    /**
     * Approve transaction.
     *
     * @throws BusinessException
     */
    public function approve(int $id, ?int $approvedBy = null): SalesTransaction
    {
        return $this->executeInTransaction(function () use ($id, $approvedBy) {
            $transaction = $this->getById($id);

            if ($transaction->status !== 'pending') {
                throw new BusinessException("Cannot approve transaction with status: {$transaction->status}");
            }

            $transaction->status = 'approved';
            $transaction->approved_at = now();
            $transaction->approved_by = $approvedBy ?? auth()->id();
            $transaction->save();

            $this->logAction('Sales transaction approved', [
                'transaction_id' => $id,
                'transaction_number' => $transaction->transaction_number,
            ]);

            return $transaction->fresh();
        });
    }

    /**
     * Cancel transaction and restore stock.
     *
     * @throws BusinessException
     */
    public function cancel(int $id, ?string $reason = null): SalesTransaction
    {
        return $this->executeInTransaction(function () use ($id, $reason) {
            $transaction = $this->getById($id);

            if ($transaction->status === 'cancelled') {
                throw new BusinessException('Transaction is already cancelled');
            }

            if ($transaction->status === 'approved') {
                throw new BusinessException('Cannot cancel approved transaction');
            }

            // Restore stock
            foreach ($transaction->items as $item) {
                $this->stockService->addStock(
                    $item->product_id,
                    $transaction->branch_id,
                    $item->quantity,
                    'return',
                    "Cancelled Transaction: {$transaction->transaction_number}"
                );
            }

            $transaction->status = 'cancelled';
            $transaction->notes = $transaction->notes
                ? "{$transaction->notes}\nCancellation Reason: {$reason}"
                : "Cancellation Reason: {$reason}";
            $transaction->save();

            $this->logAction('Sales transaction cancelled', [
                'transaction_id' => $id,
                'transaction_number' => $transaction->transaction_number,
                'reason' => $reason,
            ]);

            return $transaction->fresh();
        });
    }

    /**
     * Get transactions by sales person.
     */
    public function getBySales(int $salesId, ?string $startDate = null, ?string $endDate = null): Collection
    {
        $query = SalesTransaction::with(['branch', 'items.product'])
            ->where('sales_id', $salesId);

        if ($startDate) {
            $query->whereDate('transaction_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('transaction_date', '<=', $endDate);
        }

        return $query->orderBy('transaction_date', 'desc')->get();
    }

    /**
     * Get paginated transactions by sales person.
     */
    public function getPaginatedBySales(int $salesId, int $perPage = 15, ?string $startDate = null, ?string $endDate = null): LengthAwarePaginator
    {
        $query = SalesTransaction::with(['branch', 'items.product'])
            ->where('sales_id', $salesId);

        if ($startDate) {
            $query->whereDate('transaction_date', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('transaction_date', '<=', $endDate);
        }

        return $query->orderBy('transaction_date', 'desc')->paginate($perPage);
    }

    /**
     * Get sales summary by sales person.
     */
    public function getSalesSummary(int $salesId, ?string $startDate = null, ?string $endDate = null): array
    {
        $transactions = $this->getBySales($salesId, $startDate, $endDate);

        $totalTransactions = $transactions->count();
        $totalSales = (float) $transactions->where('status', 'approved')->sum('total');

        return [
            'sales_id' => $salesId,
            'total_transactions' => $totalTransactions,
            'total_sales' => $totalSales,
            'average_transaction' => $totalTransactions > 0 ? $totalSales / $totalTransactions : 0,
        ];
    }

    /**
     * Validate stock availability for all items in transaction.
     *
     * @throws InsufficientStockException
     */
    private function validateStockAvailability(SalesTransactionDTO $dto): void
    {
        foreach ($dto->items as $item) {
            $stock = Stock::where('product_id', $item['product_id'])
                ->where('branch_id', $dto->branch_id)
                ->first();

            $product = Product::find($item['product_id']);
            $availableQuantity = $stock?->quantity ?? 0;

            if ($availableQuantity < $item['quantity']) {
                throw new InsufficientStockException(
                    $product->name,
                    $item['quantity'],
                    $availableQuantity
                );
            }
        }
    }

    /**
     * Generate transaction number.
     */
    private function generateTransactionNumber(): string
    {
        $prefix = 'TRX';
        $date = now()->format('Ymd');
        $lastTransaction = SalesTransaction::whereDate('created_at', today())->count();
        $sequence = str_pad((string) ($lastTransaction + 1), 4, '0', STR_PAD_LEFT);

        return "{$prefix}-{$date}-{$sequence}";
    }
}
