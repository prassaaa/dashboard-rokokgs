<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Branch;
use App\Models\ProductCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Display categories list.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');
        $branchId = $isSuperAdmin ? null : (int) $user->branch_id;

        $query = ProductCategory::withCount('products')
            ->with('branches:id,name')
            ->orderBy('name');

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

        // Filter by status
        if ($request->has('status')) {
            $isActive = $request->input('status') === 'active';
            $query->where('is_active', $isActive);
        }

        // Search by name
        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $categories = $query->paginate(15);

        $branches = Branch::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories,
            'branches' => $branches,
            'filters' => $request->only(['status', 'search', 'branch_id']),
        ]);
    }

    /**
     * Show create category form.
     */
    public function create(): Response
    {
        $branches = Branch::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Categories/Create', [
            'branches' => $branches,
        ]);
    }

    /**
     * Store new category.
     */
    public function store(CreateCategoryRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Separate branch_ids from category data
        $branchIds = $validated['branch_ids'] ?? [];
        unset($validated['branch_ids']);

        $category = ProductCategory::create($validated);

        // Sync branches if branch_ids provided
        if (!empty($branchIds)) {
            $category->branches()->sync($branchIds);
        }

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category created successfully');
    }

    /**
     * Show edit category form.
     */
    public function edit(int $id): Response
    {
        $category = ProductCategory::with('branches:id')->findOrFail($id);

        $branches = Branch::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Categories/Edit', [
            'category' => $category,
            'branches' => $branches,
        ]);
    }

    /**
     * Update category.
     */
    public function update(UpdateCategoryRequest $request, int $id): RedirectResponse
    {
        $validated = $request->validated();

        $category = ProductCategory::findOrFail($id);

        // Separate branch_ids from category data
        $branchIds = $validated['branch_ids'] ?? [];
        unset($validated['branch_ids']);

        $category->update($validated);

        // Sync branches if branch_ids provided
        if (!empty($branchIds)) {
            $category->branches()->sync($branchIds);
        } else {
            $category->branches()->detach();
        }

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category updated successfully');
    }

    /**
     * Delete category.
     */
    public function destroy(int $id): RedirectResponse
    {
        $category = ProductCategory::findOrFail($id);

        // Check if category has products
        if ($category->products()->exists()) {
            return redirect()->back()
                ->with('error', 'Cannot delete category with existing products');
        }

        $category->delete();

        return redirect()->route('admin.categories.index')
            ->with('success', 'Category deleted successfully');
    }
}
