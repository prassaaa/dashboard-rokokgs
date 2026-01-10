<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\SalesTransaction;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    /**
     * Display transactions list.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $query = SalesTransaction::with(['sales:id,name', 'branch:id,name'])
            ->orderByDesc('created_at');

        // Admin Cabang can only see their branch transactions
        if (!$isSuperAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        // Filter by branch
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
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

        // Search by customer name
        if ($search = $request->input('search')) {
            $query->where('customer_name', 'like', "%{$search}%");
        }

        $transactions = $query->paginate(20);

        // Transform transactions to handle null relationships
        $transactions->through(function ($transaction) {
            $transaction->sales = $transaction->sales ?? (object) ['id' => null, 'name' => 'N/A'];
            $transaction->branch = $transaction->branch ?? (object) ['id' => null, 'name' => 'N/A'];
            return $transaction;
        });

        // Get filter options
        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        $salesUsers = User::role('Sales')
            ->when(!$isSuperAdmin, fn ($q) => $q->where('branch_id', $user->branch_id))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/Transactions/Index', [
            'transactions' => $transactions,
            'branches' => $branches,
            'salesUsers' => $salesUsers,
            'filters' => $request->only(['branch_id', 'sales_id', 'status', 'start_date', 'end_date', 'search']),
        ]);
    }

    /**
     * Show transaction detail.
     */
    public function show(int $id): Response
    {
        $user = auth()->user();

        $transaction = SalesTransaction::with([
            'sales:id,name,email',
            'branch:id,name',
            'items.product:id,name,code',
        ])->findOrFail($id);

        // Admin Cabang can only see their branch transactions
        if (!$user->hasRole('Super Admin') && $transaction->branch_id !== $user->branch_id) {
            abort(403, 'Unauthorized');
        }

        // Handle null relationships
        if (!$transaction->sales) {
            $transaction->sales = (object) ['id' => null, 'name' => 'N/A', 'email' => 'N/A'];
        }
        if (!$transaction->branch) {
            $transaction->branch = (object) ['id' => null, 'name' => 'N/A'];
        }

        // Convert proof_photo to full URL
        $transaction->proof_photo = $transaction->proof_photo ? asset('storage/' . $transaction->proof_photo) : null;

        return Inertia::render('Admin/Transactions/Show', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Approve transaction.
     */
    public function approve(int $id): RedirectResponse
    {
        $user = auth()->user();

        // Check if user has permission to approve transactions
        if (!$user->can('approve-sales-transactions')) {
            abort(403, 'Unauthorized');
        }

        $transaction = SalesTransaction::findOrFail($id);

        // Admin Cabang can only approve transactions in their branch
        if (!$user->hasRole('Super Admin') && $transaction->branch_id !== $user->branch_id) {
            abort(403, 'You can only approve transactions in your branch');
        }

        if ($transaction->status !== 'pending') {
            return redirect()->back()
                ->with('error', 'Only pending transactions can be approved');
        }

        $transaction->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()
            ->with('success', 'Transaction approved successfully');
    }

    /**
     * Reject transaction.
     */
    public function reject(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:255'],
        ]);

        $user = auth()->user();

        // Check if user has permission to approve transactions
        if (!$user->can('approve-sales-transactions')) {
            abort(403, 'Unauthorized');
        }

        $transaction = SalesTransaction::findOrFail($id);

        // Admin Cabang can only reject transactions in their branch
        if (!$user->hasRole('Super Admin') && $transaction->branch_id !== $user->branch_id) {
            abort(403, 'You can only reject transactions in your branch');
        }

        if ($transaction->status !== 'pending') {
            return redirect()->back()
                ->with('error', 'Only pending transactions can be rejected');
        }

        $transaction->update([
            'status' => 'cancelled',
            'notes' => ($transaction->notes ? $transaction->notes.' | ' : '').'Rejected: '.$request->input('rejection_reason'),
        ]);

        return redirect()->back()
            ->with('success', 'Transaction rejected successfully');
    }
}
