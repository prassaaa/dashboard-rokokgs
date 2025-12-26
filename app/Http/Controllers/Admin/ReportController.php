<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Commission;
use App\Models\Product;
use App\Models\SalesTransaction;
use App\Models\SalesTransactionItem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Display sales report.
     */
    public function sales(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->endOfMonth()->format('Y-m-d'));
        $branchId = $request->input('branch_id');

        $query = SalesTransaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'approved');

        if (!$isSuperAdmin) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $transactions = $query->with(['sales:id,name', 'branch:id,name'])->get();

        $summary = [
            'total_transactions' => $transactions->count(),
            'total_revenue' => $transactions->sum('total'),
            'average_transaction' => $transactions->avg('total') ?? 0,
            'total_discount' => $transactions->sum('discount'),
            'total_tax' => $transactions->sum('tax'),
        ];

        // Group by date
        $dailySales = $transactions->groupBy(fn ($t) => $t->created_at->format('Y-m-d'))
            ->map(fn ($group) => [
                'date' => $group->first()->created_at->format('Y-m-d'),
                'transactions' => $group->count(),
                'revenue' => $group->sum('total'),
            ])
            ->values();

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        return Inertia::render('Admin/Reports/Sales', [
            'summary' => $summary,
            'dailySales' => $dailySales,
            'branches' => $branches,
            'filters' => $request->only(['start_date', 'end_date', 'branch_id']),
        ]);
    }

    /**
     * Display product performance report.
     */
    public function products(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->endOfMonth()->format('Y-m-d'));
        $branchId = $request->input('branch_id');

        $query = SalesTransactionItem::whereHas('salesTransaction', function ($q) use ($startDate, $endDate, $isSuperAdmin, $user, $branchId) {
            $q->whereBetween('created_at', [$startDate, $endDate])
                ->where('status', 'approved');

            if (!$isSuperAdmin) {
                $q->where('branch_id', $user->branch_id);
            } elseif ($branchId) {
                $q->where('branch_id', $branchId);
            }
        });

        $productStats = $query->with('product:id,name,code')
            ->select('product_id', DB::raw('SUM(quantity) as total_quantity'), DB::raw('SUM(subtotal) as total_revenue'))
            ->groupBy('product_id')
            ->orderByDesc('total_revenue')
            ->limit(20)
            ->get();

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        return Inertia::render('Admin/Reports/Products', [
            'productStats' => $productStats,
            'branches' => $branches,
            'filters' => $request->only(['start_date', 'end_date', 'branch_id']),
        ]);
    }

    /**
     * Display sales performance report.
     */
    public function salesPerformance(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->endOfMonth()->format('Y-m-d'));
        $branchId = $request->input('branch_id');

        $query = SalesTransaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'approved');

        if (!$isSuperAdmin) {
            $query->where('branch_id', $user->branch_id);
        } elseif ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $salesStats = $query->with('sales:id,name,email')
            ->select('sales_id', DB::raw('COUNT(*) as total_transactions'), DB::raw('SUM(total) as total_revenue'))
            ->groupBy('sales_id')
            ->orderByDesc('total_revenue')
            ->get();

        // Add commission info
        $salesStats = $salesStats->map(function ($stat) use ($startDate, $endDate) {
            $commissions = Commission::where('sales_id', $stat->sales_id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            return [
                'sales' => $stat->sales,
                'total_transactions' => $stat->total_transactions,
                'total_revenue' => $stat->total_revenue,
                'total_commission' => $commissions->sum('commission_amount'),
                'pending_commission' => $commissions->where('status', 'pending')->sum('commission_amount'),
                'paid_commission' => $commissions->where('status', 'paid')->sum('commission_amount'),
            ];
        });

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        return Inertia::render('Admin/Reports/SalesPerformance', [
            'salesStats' => $salesStats,
            'branches' => $branches,
            'filters' => $request->only(['start_date', 'end_date', 'branch_id']),
        ]);
    }

    /**
     * Display commission report.
     */
    public function commissions(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $startDate = $request->input('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->input('end_date', now()->endOfMonth()->format('Y-m-d'));
        $branchId = $request->input('branch_id');

        $query = Commission::whereBetween('created_at', [$startDate, $endDate]);

        if (!$isSuperAdmin) {
            $query->whereHas('salesTransaction', fn ($q) => $q->where('branch_id', $user->branch_id));
        } elseif ($branchId) {
            $query->whereHas('salesTransaction', fn ($q) => $q->where('branch_id', $branchId));
        }

        $commissions = $query->get();

        $summary = [
            'total_commissions' => $commissions->sum('commission_amount'),
            'pending_commissions' => $commissions->where('status', 'pending')->sum('commission_amount'),
            'approved_commissions' => $commissions->where('status', 'approved')->sum('commission_amount'),
            'paid_commissions' => $commissions->where('status', 'paid')->sum('commission_amount'),
            'count_pending' => $commissions->where('status', 'pending')->count(),
            'count_approved' => $commissions->where('status', 'approved')->count(),
            'count_paid' => $commissions->where('status', 'paid')->count(),
        ];

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        return Inertia::render('Admin/Reports/Commissions', [
            'summary' => $summary,
            'branches' => $branches,
            'filters' => $request->only(['start_date', 'end_date', 'branch_id']),
        ]);
    }
}
