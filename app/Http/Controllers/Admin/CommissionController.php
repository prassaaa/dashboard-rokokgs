<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Commission;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommissionController extends Controller
{
    /**
     * Display commissions list.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $query = Commission::with(['sales:id,name', 'salesTransaction'])
            ->orderByDesc('created_at');

        // Admin Cabang can only see their branch commissions
        if (!$isSuperAdmin) {
            $query->whereHas('salesTransaction', function ($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }

        // Filter by branch
        if ($request->has('branch_id')) {
            $query->whereHas('salesTransaction', function ($q) use ($request) {
                $q->where('branch_id', $request->input('branch_id'));
            });
        }

        // Filter by sales
        if ($request->has('sales_id')) {
            $query->where('sales_id', $request->input('sales_id'));
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        $commissions = $query->paginate(20);

        // Get filter options
        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        $salesUsers = User::role('Sales')
            ->when(!$isSuperAdmin, fn ($q) => $q->where('branch_id', $user->branch_id))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Commissions/Index', [
            'commissions' => $commissions,
            'branches' => $branches,
            'salesUsers' => $salesUsers,
            'filters' => $request->only(['branch_id', 'sales_id', 'status', 'start_date', 'end_date']),
        ]);
    }

    /**
     * Approve commission.
     */
    public function approve(int $id): RedirectResponse
    {
        $commission = Commission::findOrFail($id);

        if ($commission->status !== 'pending') {
            return redirect()->back()
                ->with('error', 'Only pending commissions can be approved');
        }

        $commission->update(['status' => 'approved']);

        return redirect()->back()
            ->with('success', 'Commission approved successfully');
    }

    /**
     * Mark commission as paid.
     */
    public function markAsPaid(int $id): RedirectResponse
    {
        $commission = Commission::findOrFail($id);

        if ($commission->status !== 'approved') {
            return redirect()->back()
                ->with('error', 'Only approved commissions can be marked as paid');
        }

        $commission->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return redirect()->back()
            ->with('success', 'Commission marked as paid successfully');
    }

    /**
     * Batch approve commissions.
     */
    public function batchApprove(Request $request): RedirectResponse
    {
        $request->validate([
            'commission_ids' => ['required', 'array'],
            'commission_ids.*' => ['exists:commissions,id'],
        ]);

        Commission::whereIn('id', $request->input('commission_ids'))
            ->where('status', 'pending')
            ->update(['status' => 'approved']);

        return redirect()->back()
            ->with('success', 'Commissions approved successfully');
    }

    /**
     * Batch mark as paid.
     */
    public function batchPay(Request $request): RedirectResponse
    {
        $request->validate([
            'commission_ids' => ['required', 'array'],
            'commission_ids.*' => ['exists:commissions,id'],
        ]);

        Commission::whereIn('id', $request->input('commission_ids'))
            ->where('status', 'approved')
            ->update([
                'status' => 'paid',
                'paid_at' => now(),
            ]);

        return redirect()->back()
            ->with('success', 'Commissions marked as paid successfully');
    }
}
