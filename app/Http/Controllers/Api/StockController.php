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
     * @OA\Get(
     *     path="/api/v1/stocks",
     *     tags={"Stock"},
     *     summary="Get stock list",
     *     description="Mendapatkan daftar stock untuk cabang user yang sedang login",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Stock retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Stock retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(
     *                         property="product",
     *                         type="object",
     *                         @OA\Property(property="id", type="integer", example=1),
     *                         @OA\Property(property="name", type="string", example="Sampoerna Mild 16")
     *                     ),
     *                     @OA\Property(property="quantity", type="integer", example=100),
     *                     @OA\Property(property="minimum_stock", type="integer", example=10)
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     )
     * )
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
     * @OA\Get(
     *     path="/api/v1/stocks/product/{productId}",
     *     tags={"Stock"},
     *     summary="Get stock by product",
     *     description="Mendapatkan stock berdasarkan product ID untuk cabang user yang sedang login",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="productId",
     *         in="path",
     *         description="Product ID",
     *         required=true,
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Stock retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Stock retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="quantity", type="integer", example=100)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Stock not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Stock not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     )
     * )
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
     * @OA\Get(
     *     path="/api/v1/stocks/low-stock",
     *     tags={"Stock"},
     *     summary="Get low stock alerts",
     *     description="Mendapatkan daftar produk dengan stock rendah (di bawah minimum) untuk cabang user",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Low stock alerts retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Low stock alerts retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(
     *                         property="product",
     *                         type="object",
     *                         @OA\Property(property="name", type="string", example="Sampoerna Mild 16")
     *                     ),
     *                     @OA\Property(property="quantity", type="integer", example=5),
     *                     @OA\Property(property="minimum_stock", type="integer", example=10)
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     )
     * )
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
