<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\ProductDTO;
use App\Exceptions\DuplicateException;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Stock;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ProductService extends BaseService
{
    /**
     * Get all products with pagination.
     */
    public function getPaginated(
        int $perPage = 15,
        ?int $categoryId = null,
        bool $activeOnly = false,
        ?int $branchId = null
    ): LengthAwarePaginator {
        $query = Product::with('productCategory');

        if ($categoryId) {
            $query->where('product_category_id', $categoryId);
        }

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        $paginator = $query->orderBy('name')->paginate($perPage);

        // Add stock quantity for branch if specified
        if ($branchId !== null) {
            $stocks = Stock::where('branch_id', $branchId)
                ->get()
                ->keyBy('product_id');

            $paginator->getCollection()->transform(function ($product) use ($stocks) {
                $product->stock_quantity = $stocks->get($product->id)?->quantity ?? 0;
                return $product;
            });
        }

        return $paginator;
    }

    /**
     * Get all products.
     */
    public function getAll(bool $activeOnly = false): Collection
    {
        $query = Product::with('productCategory');

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Get product by ID.
     */
    public function getById(int $id, ?int $branchId = null): Product
    {
        $product = Product::with(['productCategory', 'stocks.branch'])->findOrFail($id);

        // Add stock quantity for branch if specified
        if ($branchId !== null) {
            $stock = $product->stocks->where('branch_id', $branchId)->first();
            $product->stock_quantity = $stock?->quantity ?? 0;
        }

        return $product;
    }

    /**
     * Search products.
     */
    public function search(string $keyword, ?int $branchId = null): Collection
    {
        $products = Product::with('productCategory')
            ->where(function ($query) use ($keyword) {
                $query->where('name', 'like', "%{$keyword}%")
                    ->orWhere('code', 'like', "%{$keyword}%")
                    ->orWhere('barcode', 'like', "%{$keyword}%");
            })
            ->where('is_active', true)
            ->limit(20)
            ->get();

        // Add stock quantity for branch if specified
        if ($branchId !== null) {
            $stocks = Stock::where('branch_id', $branchId)
                ->get()
                ->keyBy('product_id');

            $products->transform(function ($product) use ($stocks) {
                $product->stock_quantity = $stocks->get($product->id)?->quantity ?? 0;
                return $product;
            });
        }

        return $products;
    }

    /**
     * Create a new product.
     *
     * @throws DuplicateException
     */
    public function create(ProductDTO $dto): Product
    {
        return $this->executeInTransaction(function () use ($dto) {
            // Validate category exists
            $this->findOrFail(ProductCategory::class, $dto->product_category_id);

            // Check for duplicate code
            if (Product::where('code', $dto->code)->exists()) {
                throw new DuplicateException('product code', $dto->code);
            }

            // Check for duplicate barcode if provided
            if ($dto->barcode && Product::where('barcode', $dto->barcode)->exists()) {
                throw new DuplicateException('barcode', $dto->barcode);
            }

            $product = Product::create($dto->toArray());

            $this->logAction('Product created', [
                'product_id' => $product->id,
                'code' => $product->code,
            ]);

            return $product->load('productCategory');
        });
    }

    /**
     * Update an existing product.
     *
     * @throws DuplicateException
     */
    public function update(int $id, ProductDTO $dto): Product
    {
        return $this->executeInTransaction(function () use ($id, $dto) {
            $product = $this->getById($id);

            // Validate category exists
            $this->findOrFail(ProductCategory::class, $dto->product_category_id);

            // Check for duplicate code (excluding current product)
            if (Product::where('code', $dto->code)
                ->where('id', '!=', $id)
                ->exists()
            ) {
                throw new DuplicateException('product code', $dto->code);
            }

            // Check for duplicate barcode if provided (excluding current product)
            if ($dto->barcode && Product::where('barcode', $dto->barcode)
                ->where('id', '!=', $id)
                ->exists()
            ) {
                throw new DuplicateException('barcode', $dto->barcode);
            }

            $product->update($dto->toArray());

            $this->logAction('Product updated', [
                'product_id' => $product->id,
                'code' => $product->code,
            ]);

            return $product->fresh(['productCategory']);
        });
    }

    /**
     * Delete a product (soft delete).
     */
    public function delete(int $id): bool
    {
        return $this->executeInTransaction(function () use ($id) {
            $product = $this->getById($id);

            $deleted = $product->delete();

            $this->logAction('Product deleted', [
                'product_id' => $id,
                'code' => $product->code,
            ]);

            return $deleted;
        });
    }

    /**
     * Toggle product active status.
     */
    public function toggleStatus(int $id): Product
    {
        return $this->executeInTransaction(function () use ($id) {
            $product = $this->getById($id);
            $product->is_active = !$product->is_active;
            $product->save();

            $this->logAction('Product status toggled', [
                'product_id' => $id,
                'is_active' => $product->is_active,
            ]);

            return $product;
        });
    }

    /**
     * Get products by category.
     */
    public function getByCategory(int $categoryId, ?int $branchId = null): Collection
    {
        $products = Product::where('product_category_id', $categoryId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        // Add stock quantity for branch if specified
        if ($branchId !== null) {
            $stocks = Stock::where('branch_id', $branchId)
                ->get()
                ->keyBy('product_id');

            $products->transform(function ($product) use ($stocks) {
                $product->stock_quantity = $stocks->get($product->id)?->quantity ?? 0;
                return $product;
            });
        }

        return $products;
    }

    /**
     * Get product with stock summary.
     */
    public function getProductWithStockSummary(int $id): array
    {
        $product = $this->getById($id);
        $stocks = $product->stocks()->with('branch')->get();

        return [
            'product' => $product,
            'total_stock' => $stocks->sum('quantity'),
            'stock_by_branch' => $stocks->map(function ($stock) {
                return [
                    'branch' => $stock->branch->name,
                    'quantity' => $stock->quantity,
                    'below_minimum' => $stock->isBelowMinimum(),
                ];
            }),
        ];
    }
}
