<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateTargetRequest;
use App\Http\Requests\Admin\UpdateTargetRequest;
use App\Models\Branch;
use App\Models\Target;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TargetController extends Controller
{
    /**
     * Display targets list.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $query = Target::with(['branch:id,name', 'user:id,name'])
            ->orderByDesc('year')
            ->orderByDesc('month');

        // Admin Cabang can only see targets in their branch
        if (!$isSuperAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        // Filter by branch
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        // Filter by user/sales
        if ($request->has('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        // Filter by period_type
        if ($request->has('period_type')) {
            $query->where('period_type', $request->input('period_type'));
        }

        // Filter by year
        if ($request->has('year')) {
            $query->where('year', $request->input('year'));
        }

        // Filter by month
        if ($request->has('month')) {
            $query->where('month', $request->input('month'));
        }

        $targets = $query->paginate(20);

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        $salesUsers = User::role('Sales')
            ->when(!$isSuperAdmin, fn ($q) => $q->where('branch_id', $user->branch_id))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Targets/Index', [
            'targets' => $targets,
            'branches' => $branches,
            'salesUsers' => $salesUsers,
            'filters' => $request->only(['branch_id', 'user_id', 'type', 'period_type', 'year', 'month']),
        ]);
    }

    /**
     * Show create target form.
     */
    public function create(): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        $salesUsers = User::role('Sales')
            ->when(!$isSuperAdmin, fn ($q) => $q->where('branch_id', $user->branch_id))
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        return Inertia::render('Admin/Targets/Create', [
            'branches' => $branches,
            'salesUsers' => $salesUsers,
        ]);
    }

    /**
     * Store new target.
     */
    public function store(CreateTargetRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Check for existing target with same criteria
        $existing = Target::where('user_id', $validated['user_id'])
            ->where('type', $validated['type'])
            ->where('period_type', $validated['period_type'])
            ->where('year', $validated['year']);

        if ($validated['period_type'] === 'monthly') {
            $existing->where('month', $validated['month']);
        }

        if ($existing->exists()) {
            return redirect()->back()
                ->with('error', 'Target dengan kriteria yang sama sudah ada')
                ->withInput();
        }

        Target::create($validated);

        return redirect()->route('admin.targets.index')
            ->with('success', 'Target berhasil dibuat');
    }

    /**
     * Show edit target form.
     */
    public function edit(int $id): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $target = Target::with(['branch', 'user'])->findOrFail($id);

        // Admin Cabang can only edit targets in their branch
        if (!$isSuperAdmin && $target->branch_id !== $user->branch_id) {
            abort(403, 'Unauthorized');
        }

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        $salesUsers = User::role('Sales')
            ->when(!$isSuperAdmin, fn ($q) => $q->where('branch_id', $user->branch_id))
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        return Inertia::render('Admin/Targets/Edit', [
            'target' => $target,
            'branches' => $branches,
            'salesUsers' => $salesUsers,
        ]);
    }

    /**
     * Update target.
     */
    public function update(UpdateTargetRequest $request, int $id): RedirectResponse
    {
        $validated = $request->validated();

        $target = Target::findOrFail($id);
        $target->update($validated);

        return redirect()->route('admin.targets.index')
            ->with('success', 'Target berhasil diperbarui');
    }

    /**
     * Delete target.
     */
    public function destroy(int $id): RedirectResponse
    {
        $user = auth()->user();
        $target = Target::findOrFail($id);

        // Admin Cabang can only delete targets in their branch
        if (!$user->hasRole('Super Admin') && $target->branch_id !== $user->branch_id) {
            abort(403, 'Unauthorized');
        }

        $target->delete();

        return redirect()->route('admin.targets.index')
            ->with('success', 'Target berhasil dihapus');
    }
}
