<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Resources\StockResource;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockController extends BaseApiController
{
    public function __construct(
        private readonly StockService $stockService
    ) {
    }

    /**
     * Get stock list for current user's branch.
     */
    public function index(Request $request): JsonResponse
    {
        $branchId = auth()->user()->branch_id;
        $stocks = $this->stockService->getByBranch($branchId);

        return $this->successResponse(
            StockResource::collection($stocks->load(['product', 'branch'])),
            'Stock retrieved successfully'
        );
    }

    /**
     * Get stock by product ID (for current branch).
     */
    public function byProduct(int $productId): JsonResponse
    {
        $branchId = auth()->user()->branch_id;
        $stocks = $this->stockService->getByProduct($productId);
        $stock = $stocks->where('branch_id', $branchId)->first();

        if (!$stock) {
            return $this->errorResponse('Stock not found', 404);
        }

        return $this->successResponse(
            new StockResource($stock->load(['product', 'branch'])),
            'Stock retrieved successfully'
        );
    }

    /**
     * Get low stock alerts for current branch.
     */
    public function lowStock(): JsonResponse
    {
        $branchId = auth()->user()->branch_id;
        $stocks = $this->stockService->getLowStockAlerts($branchId);

        return $this->successResponse(
            StockResource::collection($stocks),
            'Low stock alerts retrieved successfully'
        );
    }
}
