<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateBranchRequest;
use App\Http\Requests\Admin\UpdateBranchRequest;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    /**
     * Display branches list.
     */
    public function index(Request $request): Response
    {
        // Only Super Admin can manage branches
        abort_unless(auth()->user()->hasRole('Super Admin'), 403);

        $query = Branch::withCount(['users', 'stocks'])
            ->orderBy('name');

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

        $branches = $query->paginate(15);

        return Inertia::render('Admin/Branches/Index', [
            'branches' => $branches,
            'filters' => $request->only(['status', 'search']),
        ]);
    }

    /**
     * Show create branch form.
     */
    public function create(): Response
    {
        abort_unless(auth()->user()->hasRole('Super Admin'), 403);

        return Inertia::render('Admin/Branches/Create');
    }

    /**
     * Store new branch.
     */
    public function store(CreateBranchRequest $request): RedirectResponse
    {
        // Only Super Admin can create branches
        abort_unless(auth()->user()->hasRole('Super Admin'), 403);

        $validated = $request->validated();

        Branch::create($validated);

        return redirect()->route('admin.branches.index')
            ->with('success', 'Branch created successfully');
    }

    /**
     * Show edit branch form.
     */
    public function edit(int $id): Response
    {
        abort_unless(auth()->user()->hasRole('Super Admin'), 403);

        $branch = Branch::findOrFail($id);

        return Inertia::render('Admin/Branches/Edit', [
            'branch' => $branch,
        ]);
    }

    /**
     * Update branch.
     */
    public function update(UpdateBranchRequest $request, int $id): RedirectResponse
    {
        // Only Super Admin can update branches
        abort_unless(auth()->user()->hasRole('Super Admin'), 403);

        $validated = $request->validated();

        $branch = Branch::findOrFail($id);
        $branch->update($validated);

        return redirect()->route('admin.branches.index')
            ->with('success', 'Branch updated successfully');
    }

    /**
     * Delete branch.
     */
    public function destroy(int $id): RedirectResponse
    {
        abort_unless(auth()->user()->hasRole('Super Admin'), 403);

        $branch = Branch::findOrFail($id);

        // Check if branch has users
        if ($branch->users()->exists()) {
            return redirect()->back()
                ->with('error', 'Cannot delete branch with existing users');
        }

        // Check if branch has stocks
        if ($branch->stocks()->exists()) {
            return redirect()->back()
                ->with('error', 'Cannot delete branch with existing stocks');
        }

        $branch->delete();

        return redirect()->route('admin.branches.index')
            ->with('success', 'Branch deleted successfully');
    }
}
