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
            $query->whereColumn('quantity', '<=', 'min_stock');
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
        $validated = $request->validated();
        $stock = Stock::findOrFail($id);

        DB::transaction(function () use ($stock, $validated) {
            $oldQuantity = $stock->quantity;
            $newQuantity = $oldQuantity + $validated['quantity_change'];

            // Update stock
            $stock->update([
                'quantity' => max(0, $newQuantity), // Ensure non-negative
            ]);

            // Record movement
            StockMovement::create([
                'stock_id' => $stock->id,
                'type' => $validated['quantity_change'] > 0 ? 'in' : 'out',
                'quantity' => abs($validated['quantity_change']),
                'reference_type' => 'adjustment',
                'notes' => $validated['notes'] ?? 'Manual adjustment',
                'created_by' => auth()->id(),
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

        $movements = StockMovement::where('stock_id', $id)
            ->with('createdBy:id,name')
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
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'branch_id' => ['required', 'exists:branches,id'],
            'quantity' => ['required', 'integer', 'min:0'],
            'min_stock' => ['required', 'integer', 'min:0'],
        ]);

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
                StockMovement::create([
                    'stock_id' => $stock->id,
                    'type' => 'in',
                    'quantity' => $validated['quantity'],
                    'reference_type' => 'initial',
                    'notes' => 'Initial stock',
                    'created_by' => auth()->id(),
                ]);
            }
        });

        return redirect()->route('admin.stocks.index')
            ->with('success', 'Stock initialized successfully');
    }
}
