<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdjustStockRequest;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    /**
     * Display stocks list.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $query = Stock::with(['product:id,name,code', 'branch:id,name'])
            ->orderBy('quantity');

        // Admin Cabang can only see their branch stocks
        if (!$isSuperAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        // Filter by branch
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        // Filter low stock
        if ($request->boolean('low_stock')) {
            $query->whereColumn('quantity', '<=', 'minimum_stock');
        }

        // Search by product
        if ($search = $request->input('search')) {
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $stocks = $query->paginate(20);

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        return Inertia::render('Admin/Stocks/Index', [
            'stocks' => $stocks,
            'branches' => $branches,
            'filters' => $request->only(['branch_id', 'low_stock', 'search']),
        ]);
    }

    /**
     * Show adjust stock form.
     */
    public function adjust(int $id): Response
    {
        $stock = Stock::with(['product', 'branch'])->findOrFail($id);

        return Inertia::render('Admin/Stocks/Adjust', [
            'stock' => $stock,
        ]);
    }

    /**
     * Process stock adjustment.
     */
    public function processAdjustment(AdjustStockRequest $request, int $id): RedirectResponse
    {
        $user = auth()->user();

        // Check if user has permission to edit stocks
        if (!$user->can('edit-stocks')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validated();
        $stock = Stock::findOrFail($id);

        // Admin Cabang can only adjust stocks in their branch
        if (!$user->hasRole('Super Admin') && $stock->branch_id !== $user->branch_id) {
            abort(403, 'You can only adjust stocks in your branch');
        }

        DB::transaction(function () use ($stock, $validated) {
            $oldQuantity = $stock->quantity;
            $quantityChange = (int) $validated['quantity_change'];
            $newQuantity = $oldQuantity + $quantityChange;

            // Update stock
            $stock->update([
                'quantity' => max(0, $newQuantity), // Ensure non-negative
            ]);

            // Generate reference number
            $prefix = 'STK';
            $date = now()->format('Ymd');
            $random = strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 6));
            $referenceNumber = "{$prefix}-{$date}-{$random}";

            // Record movement
            StockMovement::create([
                'reference_number' => $referenceNumber,
                'product_id' => $stock->product_id,
                'type' => $quantityChange > 0 ? 'in' : 'out',
                'quantity' => abs($quantityChange),
                'notes' => $validated['notes'] ?? 'Manual adjustment',
                'created_by' => auth()->id(),
                // Set appropriate branch based on type
                'to_branch_id' => $quantityChange > 0 ? $stock->branch_id : null,
                'from_branch_id' => $quantityChange < 0 ? $stock->branch_id : null,
            ]);
        });

        return redirect()->route('admin.stocks.index')
            ->with('success', 'Stock adjusted successfully');
    }

    /**
     * Show stock movements history.
     */
    public function movements(Request $request, int $id): Response
    {
        $stock = Stock::with(['product', 'branch'])->findOrFail($id);

        $movements = StockMovement::where('product_id', $stock->product_id)
            ->where(function ($query) use ($stock) {
                $query->where('from_branch_id', $stock->branch_id)
                    ->orWhere('to_branch_id', $stock->branch_id);
            })
            ->with('creator:id,name')
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('Admin/Stocks/Movements', [
            'stock' => $stock,
            'movements' => $movements,
        ]);
    }

    /**
     * Initialize stock for product in branch.
     */
    public function initialize(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $products = Product::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        return Inertia::render('Admin/Stocks/Initialize', [
            'products' => $products,
            'branches' => $branches,
        ]);
    }

    /**
     * Store initial stock.
     */
    public function storeInitial(Request $request): RedirectResponse
    {
        $user = auth()->user();

        // Check if user has permission to create stocks
        if (!$user->can('create-stocks')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'quantity' => ['required', 'integer', 'min:0'],
            'minimum_stock' => ['required', 'integer', 'min:0'],
        ]);

        // Admin Cabang can only create stocks for their branch
        if (!$user->hasRole('Super Admin') && $validated['branch_id'] != $user->branch_id) {
            abort(403, 'You can only create stocks for your branch');
        }

        // Check if stock already exists
        $existingStock = Stock::where('product_id', $validated['product_id'])
            ->where('branch_id', $validated['branch_id'])
            ->first();

        if ($existingStock) {
            return redirect()->back()
                ->with('error', 'Stock already exists for this product in this branch');
        }

        DB::transaction(function () use ($validated) {
            $stock = Stock::create($validated);

            // Record initial movement
            if ($validated['quantity'] > 0) {
                // Generate reference number
                $prefix = 'STK';
                $date = now()->format('Ymd');
                $random = strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 6));
                $referenceNumber = "{$prefix}-{$date}-{$random}";

                StockMovement::create([
                    'reference_number' => $referenceNumber,
                    'product_id' => $stock->product_id,
                    'to_branch_id' => $stock->branch_id,
                    'type' => 'in',
                    'quantity' => $validated['quantity'],
                    'notes' => 'Initial stock',
                    'created_by' => auth()->id(),
                ]);
            }
        });

        return redirect()->route('admin.stocks.index')
            ->with('success', 'Stock initialized successfully');
    }
}
