<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
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

        // Transform to handle null products
        $productStats = $productStats->map(function ($stat) {
            return [
                'product' => $stat->product ?? (object) ['id' => null, 'name' => 'N/A', 'code' => 'N/A'],
                'total_quantity' => $stat->total_quantity,
                'total_revenue' => $stat->total_revenue,
            ];
        });

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

        // Map sales stats
        $salesStats = $salesStats->map(function ($stat) {
            return [
                'sales' => $stat->sales ?? (object) ['id' => null, 'name' => 'N/A', 'email' => 'N/A'],
                'total_transactions' => $stat->total_transactions,
                'total_revenue' => $stat->total_revenue,
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
}
