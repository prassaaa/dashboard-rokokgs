<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use App\Models\Visit;
use App\Services\VisitService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VisitController extends Controller
{
    public function __construct(
        private readonly VisitService $visitService
    ) {
    }

    /**
     * Display visits list.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $query = Visit::with(['sales:id,name', 'branch:id,name', 'area:id,name'])
            ->orderByDesc('created_at');

        // Admin Cabang can only see their branch visits
        if (!$isSuperAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        // Filter by branch
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        // Filter by sales
        if ($request->filled('sales_id')) {
            $query->where('sales_id', $request->input('sales_id'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by visit type
        if ($request->filled('visit_type')) {
            $query->where('visit_type', $request->input('visit_type'));
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->whereDate('visit_date', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('visit_date', '<=', $request->input('end_date'));
        }

        // Search by customer name
        if ($search = $request->input('search')) {
            $query->where('customer_name', 'like', "%{$search}%");
        }

        $visits = $query->paginate(20);

        // Transform visits to handle null relationships
        $visits->through(function ($visit) {
            $visit->sales = $visit->sales ?? (object) ['id' => null, 'name' => 'N/A'];
            $visit->branch = $visit->branch ?? (object) ['id' => null, 'name' => 'N/A'];
            $visit->area = $visit->area ?? (object) ['id' => null, 'name' => 'N/A'];
            return $visit;
        });

        // Get filter options
        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        $salesUsers = User::role('Sales')
            ->when(!$isSuperAdmin, fn ($q) => $q->where('branch_id', $user->branch_id))
            ->orderBy('name')
            ->get(['id', 'name']);

        // Get statistics
        $statistics = $this->visitService->getStatistics(
            $isSuperAdmin ? null : $user->branch_id
        );

        return Inertia::render('Admin/Visits/Index', [
            'visits' => $visits,
            'branches' => $branches,
            'salesUsers' => $salesUsers,
            'statistics' => $statistics,
            'visitTypes' => [
                ['value' => 'routine', 'label' => 'Rutin'],
                ['value' => 'prospecting', 'label' => 'Prospecting'],
                ['value' => 'follow_up', 'label' => 'Follow Up'],
                ['value' => 'complaint', 'label' => 'Komplain'],
                ['value' => 'other', 'label' => 'Lainnya'],
            ],
            'filters' => $request->only(['branch_id', 'sales_id', 'status', 'visit_type', 'start_date', 'end_date', 'search']),
        ]);
    }

    /**
     * Show visit detail.
     */
    public function show(int $id): Response
    {
        $user = auth()->user();

        $visit = Visit::with([
            'sales:id,name,email',
            'branch:id,name',
            'area:id,name',
            'approver:id,name',
        ])->findOrFail($id);

        // Admin Cabang can only see their branch visits
        if (!$user->hasRole('Super Admin') && (int) $visit->branch_id !== (int) $user->branch_id) {
            abort(403, 'You can only view visits in your branch');
        }

        // Handle null relationships
        if (!$visit->sales) {
            $visit->sales = (object) ['id' => null, 'name' => 'N/A', 'email' => 'N/A'];
        }
        if (!$visit->branch) {
            $visit->branch = (object) ['id' => null, 'name' => 'N/A'];
        }
        if (!$visit->area) {
            $visit->area = (object) ['id' => null, 'name' => 'N/A'];
        }

        // Convert photo to full URL
        $visit->photo = $visit->photo ? asset('storage/' . $visit->photo) : null;

        return Inertia::render('Admin/Visits/Show', [
            'visit' => $visit,
        ]);
    }

    /**
     * Approve visit.
     */
    public function approve(int $id): RedirectResponse
    {
        $user = auth()->user();

        // Check if user has permission
        if (!$user->can('approve-sales-transactions')) {
            abort(403, 'Unauthorized');
        }

        $visit = Visit::findOrFail($id);

        // Admin Cabang can only approve visits in their branch
        if (!$user->hasRole('Super Admin') && (int) $visit->branch_id !== (int) $user->branch_id) {
            abort(403, 'You can only approve visits in your branch');
        }

        if ($visit->status !== 'pending') {
            return redirect()->back()
                ->with('error', 'Only pending visits can be approved');
        }

        $visit->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()
            ->with('success', 'Visit approved successfully');
    }

    /**
     * Reject visit.
     */
    public function reject(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:255'],
        ]);

        $user = auth()->user();

        // Check if user has permission
        if (!$user->can('approve-sales-transactions')) {
            abort(403, 'Unauthorized');
        }

        $visit = Visit::findOrFail($id);

        // Admin Cabang can only reject visits in their branch
        if (!$user->hasRole('Super Admin') && (int) $visit->branch_id !== (int) $user->branch_id) {
            abort(403, 'You can only reject visits in your branch');
        }

        if ($visit->status !== 'pending') {
            return redirect()->back()
                ->with('error', 'Only pending visits can be rejected');
        }

        $visit->update([
            'status' => 'rejected',
            'notes' => ($visit->notes ? $visit->notes . ' | ' : '') . 'Rejected: ' . $request->input('rejection_reason'),
        ]);

        return redirect()->back()
            ->with('success', 'Visit rejected successfully');
    }

    /**
     * Display visit locations map.
     */
    public function locations(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $query = Visit::with(['sales:id,name', 'branch:id,name'])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->orderByDesc('created_at');

        // Admin Cabang can only see their branch visits
        if (!$isSuperAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        // Filter by branch
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        // Filter by sales
        if ($request->filled('sales_id')) {
            $query->where('sales_id', $request->input('sales_id'));
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by visit type
        if ($request->filled('visit_type')) {
            $query->where('visit_type', $request->input('visit_type'));
        }

        // Filter by date range
        if ($request->filled('start_date')) {
            $query->whereDate('visit_date', '>=', $request->input('start_date'));
        }
        if ($request->filled('end_date')) {
            $query->whereDate('visit_date', '<=', $request->input('end_date'));
        }

        $visits = $query->get()->map(function ($visit) {
            return [
                'id' => $visit->id,
                'visit_number' => $visit->visit_number,
                'customer_name' => $visit->customer_name,
                'customer_address' => $visit->customer_address,
                'visit_type' => $visit->visit_type,
                'status' => $visit->status,
                'purpose' => $visit->purpose,
                'latitude' => (float) $visit->latitude,
                'longitude' => (float) $visit->longitude,
                'visit_date' => $visit->visit_date?->toDateString(),
                'created_at' => $visit->created_at?->toISOString(),
                'sales' => $visit->sales ? [
                    'id' => $visit->sales->id,
                    'name' => $visit->sales->name,
                ] : null,
                'branch' => $visit->branch ? [
                    'id' => $visit->branch->id,
                    'name' => $visit->branch->name,
                ] : null,
            ];
        });

        // Get filter options
        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        $salesUsers = User::role('Sales')
            ->when(!$isSuperAdmin, fn ($q) => $q->where('branch_id', $user->branch_id))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Visits/Locations', [
            'visits' => $visits,
            'branches' => $branches,
            'salesUsers' => $salesUsers,
            'visitTypes' => [
                ['value' => 'routine', 'label' => 'Rutin'],
                ['value' => 'prospecting', 'label' => 'Prospecting'],
                ['value' => 'follow_up', 'label' => 'Follow Up'],
                ['value' => 'complaint', 'label' => 'Komplain'],
                ['value' => 'other', 'label' => 'Lainnya'],
            ],
            'filters' => $request->only(['branch_id', 'sales_id', 'status', 'visit_type', 'start_date', 'end_date']),
        ]);
    }
}
