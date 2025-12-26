<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Commission;
use App\Models\Product;
use App\Models\SalesTransaction;
use App\Models\Stock;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display admin dashboard with statistics.
     */
    public function index(): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');
        $branchId = $isSuperAdmin ? null : $user->branch_id;

        // Base statistics
        $stats = [
            'total_users' => $this->getTotalUsers($branchId),
            'total_sales' => $this->getTotalSales($branchId),
            'total_branches' => $isSuperAdmin ? Branch::count() : 1,
            'total_products' => Product::where('is_active', true)->count(),
        ];

        // Sales statistics (current month)
        $salesStats = $this->getSalesStatistics($branchId);

        // Recent transactions
        $recentTransactions = $this->getRecentTransactions($branchId);

        // Low stock alerts
        $lowStockAlerts = $this->getLowStockAlerts($branchId);

        // Pending approvals
        $pendingApprovals = $this->getPendingApprovals($branchId);

        // Sales trend (last 7 days)
        $salesTrend = $this->getSalesTrend($branchId);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'salesStats' => $salesStats,
            'recentTransactions' => $recentTransactions,
            'lowStockAlerts' => $lowStockAlerts,
            'pendingApprovals' => $pendingApprovals,
            'salesTrend' => $salesTrend,
        ]);
    }

    /**
     * Get total users count.
     */
    private function getTotalUsers(?int $branchId): int
    {
        $query = User::query();

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->count();
    }

    /**
     * Get total sales users count.
     */
    private function getTotalSales(?int $branchId): int
    {
        $query = User::role('Sales');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->count();
    }

    /**
     * Get sales statistics for current month.
     */
    private function getSalesStatistics(?int $branchId): array
    {
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $query = SalesTransaction::whereBetween('created_at', [$startOfMonth, $endOfMonth]);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $transactions = $query->get();

        return [
            'total_transactions' => $transactions->count(),
            'total_revenue' => $transactions->sum('total'),
            'average_transaction' => $transactions->avg('total') ?? 0,
            'completed_transactions' => $transactions->where('status', 'approved')->count(),
        ];
    }

    /**
     * Get recent transactions (last 10).
     */
    private function getRecentTransactions(?int $branchId): array
    {
        $query = SalesTransaction::with(['sales:id,name', 'branch:id,name'])
            ->orderByDesc('created_at')
            ->limit(10);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->get()->map(fn ($transaction) => [
            'id' => $transaction->id,
            'customer_name' => $transaction->customer_name,
            'total' => $transaction->total,
            'status' => $transaction->status,
            'sales_name' => $transaction->sales->name,
            'branch_name' => $transaction->branch->name,
            'created_at' => $transaction->created_at->format('Y-m-d H:i'),
        ])->toArray();
    }

    /**
     * Get low stock alerts.
     */
    private function getLowStockAlerts(?int $branchId): array
    {
        $query = Stock::with(['product:id,name,code', 'branch:id,name'])
            ->whereColumn('quantity', '<=', 'minimum_stock')
            ->orderBy('quantity')
            ->limit(10);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->get()->map(fn ($stock) => [
            'id' => $stock->id,
            'product_name' => $stock->product->name,
            'product_code' => $stock->product->code,
            'quantity' => $stock->quantity,
            'minimum_stock' => $stock->minimum_stock,
            'branch_name' => $stock->branch->name,
        ])->toArray();
    }

    /**
     * Get pending approvals (users, commissions).
     */
    private function getPendingApprovals(?int $branchId): array
    {
        // Pending user registrations
        $pendingUsersQuery = User::where('is_active', false);
        if ($branchId) {
            $pendingUsersQuery->where('branch_id', $branchId);
        }
        $pendingUsers = $pendingUsersQuery->count();

        // Pending commissions
        $pendingCommissionsQuery = Commission::where('status', 'pending');
        if ($branchId) {
            $pendingCommissionsQuery->whereHas('salesTransaction', function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            });
        }
        $pendingCommissions = $pendingCommissionsQuery->count();

        return [
            'pending_users' => $pendingUsers,
            'pending_commissions' => $pendingCommissions,
        ];
    }

    /**
     * Get sales trend for last 7 days.
     */
    private function getSalesTrend(?int $branchId): array
    {
        $days = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $days[] = $date->format('Y-m-d');
        }

        $query = SalesTransaction::selectRaw('DATE(created_at) as date, COUNT(*) as count, SUM(total) as revenue')
            ->whereIn(DB::raw('DATE(created_at)'), $days)
            ->groupBy(DB::raw('DATE(created_at)'));

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $data = $query->get()->keyBy('date');

        return collect($days)->map(function ($date) use ($data) {
            $dayData = $data->get($date);
            return [
                'date' => $date,
                'transactions' => $dayData?->count ?? 0,
                'revenue' => $dayData?->revenue ?? 0,
            ];
        })->toArray();
    }
}
