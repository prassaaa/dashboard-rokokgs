<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateAreaRequest;
use App\Http\Requests\Admin\UpdateAreaRequest;
use App\Models\Area;
use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AreaController extends Controller
{
    /**
     * Display areas list.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $query = Area::with(['branch:id,name'])
            ->withCount('users')
            ->orderBy('name');

        // Admin Cabang can only see areas in their branch
        if (!$isSuperAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        // Filter by branch
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
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

        $areas = $query->paginate(15);

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        return Inertia::render('Admin/Areas/Index', [
            'areas' => $areas,
            'branches' => $branches,
            'filters' => $request->only(['branch_id', 'status', 'search']),
        ]);
    }

    /**
     * Show create area form.
     */
    public function create(): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        return Inertia::render('Admin/Areas/Create', [
            'branches' => $branches,
        ]);
    }

    /**
     * Store new area.
     */
    public function store(CreateAreaRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        Area::create($validated);

        return redirect()->route('admin.areas.index')
            ->with('success', 'Area berhasil dibuat');
    }

    /**
     * Show edit area form.
     */
    public function edit(int $id): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $area = Area::with('branch')->findOrFail($id);

        // Admin Cabang can only edit areas in their branch
        if (!$isSuperAdmin && $area->branch_id !== $user->branch_id) {
            abort(403, 'Unauthorized');
        }

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        return Inertia::render('Admin/Areas/Edit', [
            'area' => $area,
            'branches' => $branches,
        ]);
    }

    /**
     * Update area.
     */
    public function update(UpdateAreaRequest $request, int $id): RedirectResponse
    {
        $validated = $request->validated();

        $area = Area::findOrFail($id);
        $area->update($validated);

        return redirect()->route('admin.areas.index')
            ->with('success', 'Area berhasil diperbarui');
    }

    /**
     * Delete area.
     */
    public function destroy(int $id): RedirectResponse
    {
        $user = auth()->user();
        $area = Area::findOrFail($id);

        // Admin Cabang can only delete areas in their branch
        if (!$user->hasRole('Super Admin') && $area->branch_id !== $user->branch_id) {
            abort(403, 'Unauthorized');
        }

        // Check if area has users
        if ($area->users()->exists()) {
            return redirect()->back()
                ->with('error', 'Tidak dapat menghapus area yang masih memiliki pengguna');
        }

        // Check if area has transactions
        if ($area->salesTransactions()->exists()) {
            return redirect()->back()
                ->with('error', 'Tidak dapat menghapus area yang masih memiliki transaksi');
        }

        $area->delete();

        return redirect()->route('admin.areas.index')
            ->with('success', 'Area berhasil dihapus');
    }
}
