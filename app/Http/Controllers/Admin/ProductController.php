<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\ProductCategory;
use App\Models\Product;
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
        $query = Product::with('productCategory:id,name')
            ->orderByDesc('created_at');

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

        return Inertia::render('Admin/Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['category_id', 'status', 'search']),
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

        return Inertia::render('Admin/Products/Create', [
            'categories' => $categories,
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

        Product::create($validated);

        return redirect()->route('admin.products.index')
            ->with('success', 'Product created successfully');
    }

    /**
     * Show edit product form.
     */
    public function edit(int $id): Response
    {
        $product = Product::with('productCategory')->findOrFail($id);

        $categories = ProductCategory::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Products/Edit', [
            'product' => $product,
            'categories' => $categories,
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

        $product->update($validated);

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
