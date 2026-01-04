<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Branch;
use App\Models\ProductCategory;
use App\Models\Product;
use App\Models\Stock;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display products list.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');
        $branchId = $isSuperAdmin ? null : (int) $user->branch_id;

        $query = Product::with(['productCategory:id,name', 'branches:id,name'])
            ->orderByDesc('created_at');

        // Filter by branch for Super Admin (from request)
        if ($isSuperAdmin && $request->has('branch_id') && $request->input('branch_id') !== 'all') {
            $filterBranchId = (int) $request->input('branch_id');
            $query->whereHas('branches', function ($q) use ($filterBranchId) {
                $q->where('branches.id', $filterBranchId);
            });
        }

        // Filter by branch for non-Super Admin
        if (!$isSuperAdmin && $branchId) {
            $query->whereHas('branches', function ($q) use ($branchId) {
                $q->where('branches.id', $branchId);
            })->orWhereDoesntHave('branches');
        }

        // Filter by category
        if ($request->has('category_id')) {
            $query->where('product_category_id', $request->input('category_id'));
        }

        // Filter by status
        if ($request->has('status')) {
            $isActive = $request->input('status') === 'active';
            $query->where('is_active', $isActive);
        }

        // Search by name or code
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $products = $query->paginate(15);

        $categories = ProductCategory::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $branches = Branch::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'branches' => $branches,
            'filters' => $request->only(['category_id', 'status', 'search', 'branch_id']),
        ]);
    }

    /**
     * Show create product form.
     */
    public function create(): Response
    {
        $categories = ProductCategory::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $branches = Branch::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Products/Create', [
            'categories' => $categories,
            'branches' => $branches,
        ]);
    }

    /**
     * Store new product.
     */
    public function store(CreateProductRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Handle image upload if exists
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        // Separate branch_ids from product data
        $branchIds = $validated['branch_ids'] ?? [];
        unset($validated['branch_ids']);

        $product = Product::create($validated);

        // Sync branches and auto-create stock records
        if (!empty($branchIds)) {
            $product->branches()->sync($branchIds);

            // Auto-create stock record for each branch
            foreach ($branchIds as $branchId) {
                Stock::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => $branchId,
                    ],
                    [
                        'quantity' => 0,
                        'minimum_stock' => 10, // Default minimum stock
                    ]
                );
            }
        }

        return redirect()->route('admin.products.index')
            ->with('success', 'Product created successfully');
    }

    /**
     * Show edit product form.
     */
    public function edit(int $id): Response
    {
        $product = Product::with(['productCategory', 'branches:id'])->findOrFail($id);

        $categories = ProductCategory::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        $branches = Branch::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'branches' => $branches,
        ]);
    }

    /**
     * Update product.
     */
    public function update(UpdateProductRequest $request, int $id): RedirectResponse
    {
        $validated = $request->validated();

        $product = Product::findOrFail($id);

        // Handle image upload if exists
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($product->image) {
                \Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        } elseif ($request->input('remove_image') === '1') {
            // Remove image if requested
            if ($product->image) {
                \Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = null;
        }

        // Separate branch_ids from product data
        $branchIds = $validated['branch_ids'] ?? [];
        unset($validated['branch_ids']);

        $product->update($validated);

        // Get old branch IDs before sync
        $oldBranchIds = $product->branches()->pluck('branches.id')->toArray();

        // Sync branches
        if (!empty($branchIds)) {
            $product->branches()->sync($branchIds);

            // Find new branches (added)
            $newBranchIds = array_diff($branchIds, $oldBranchIds);

            // Auto-create stock record for new branches
            foreach ($newBranchIds as $branchId) {
                Stock::firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => $branchId,
                    ],
                    [
                        'quantity' => 0,
                        'minimum_stock' => 20, // Default minimum stock
                    ]
                );
            }

            // Find removed branches
            $removedBranchIds = array_diff($oldBranchIds, $branchIds);

            // Optional: Delete stock records for removed branches
            // Stock::where('product_id', $product->id)
            //     ->whereIn('branch_id', $removedBranchIds)
            //     ->delete();

        } else {
            $product->branches()->detach();
        }

        return redirect()->route('admin.products.index')
            ->with('success', 'Product updated successfully');
    }

    /**
     * Delete product.
     */
    public function destroy(int $id): RedirectResponse
    {
        $product = Product::findOrFail($id);

        // Check if product has stock
        if ($product->stocks()->exists()) {
            return redirect()->back()
                ->with('error', 'Cannot delete product with existing stock');
        }

        // Delete image if exists
        if ($product->image) {
            \Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return redirect()->route('admin.products.index')
            ->with('success', 'Product deleted successfully');
    }
}
