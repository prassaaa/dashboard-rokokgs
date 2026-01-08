<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DataTransferObjects\SalesTransactionDTO;
use App\Http\Requests\Api\CreateTransactionRequest;
use App\Http\Resources\SalesTransactionResource;
use App\Services\SalesTransactionService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends BaseApiController
{
    public function __construct(
        private readonly SalesTransactionService $transactionService
    ) {
    }

    /**
     * @OA\Get(
     *     path="/api/v1/transactions",
     *     tags={"Transactions"},
     *     summary="Get transactions list",
     *     description="Sales melihat transaksi sendiri, Admin/Manager melihat semua transaksi di cabangnya",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Page number",
     *         required=false,
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Transactions retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Transactions retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="customer_name", type="string", example="Toko Maju Jaya"),
     *                     @OA\Property(property="total", type="number", format="float", example=500000),
     *                     @OA\Property(property="status", type="string", example="approved")
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
        $user = auth()->user();
        $branchId = $user->branch_id;

        // Sales can only see their own transactions
        if ($user->hasRole('Sales')) {
            $transactions = $this->transactionService->getPaginated(
                branchId: $branchId,
                salesId: $user->id
            );
        } else {
            // Admin/Manager can see all transactions in their branch
            $transactions = $this->transactionService->getPaginated(branchId: $branchId);
        }

        return $this->paginatedResponse(
            $transactions,
            SalesTransactionResource::class,
            'Transactions retrieved successfully'
        );
    }

    /**
     * @OA\Post(
     *     path="/api/v1/transactions",
     *     tags={"Transactions"},
     *     summary="Create new transaction",
     *     description="Sales membuat transaksi baru dengan items produk",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"customer_name","items","subtotal","total","payment_method"},
     *             @OA\Property(property="area_id", type="integer", example=1, description="Area ID where transaction occurs"),
     *             @OA\Property(property="customer_name", type="string", example="Toko Maju Jaya"),
     *             @OA\Property(property="customer_phone", type="string", example="081234567890"),
     *             @OA\Property(property="customer_address", type="string", example="Jl. Sudirman No. 123"),
     *             @OA\Property(property="latitude", type="number", format="float", example=-6.200000),
     *             @OA\Property(property="longitude", type="number", format="float", example=106.816666),
     *             @OA\Property(
     *                 property="items",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="product_id", type="integer", example=1),
     *                     @OA\Property(property="quantity", type="integer", example=10),
     *                     @OA\Property(property="price", type="number", format="float", example=25000)
     *                 )
     *             ),
     *             @OA\Property(property="subtotal", type="number", format="float", example=250000),
     *             @OA\Property(property="discount", type="number", format="float", example=0),
     *             @OA\Property(property="total", type="number", format="float", example=250000),
     *             @OA\Property(property="payment_method", type="string", example="cash"),
     *             @OA\Property(property="notes", type="string", example="Pengiriman segera")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Transaction created successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Transaction created successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="customer_name", type="string", example="Toko Maju Jaya"),
     *                 @OA\Property(property="total", type="number", format="float", example=250000)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error or insufficient stock",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Insufficient stock for product")
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
    public function store(CreateTransactionRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = auth()->user();

        $dto = new SalesTransactionDTO(
            branch_id: $user->branch_id,
            sales_id: $user->id,
            customer_name: $validated['customer_name'],
            customer_phone: $validated['customer_phone'] ?? null,
            customer_address: $validated['customer_address'] ?? null,
            latitude: isset($validated['latitude']) ? (float) $validated['latitude'] : null,
            longitude: isset($validated['longitude']) ? (float) $validated['longitude'] : null,
            items: $validated['items'],
            subtotal: $validated['subtotal'],
            discount: $validated['discount'] ?? 0,
            total: $validated['total'],
            payment_method: $validated['payment_method'],
            notes: $validated['notes'] ?? null,
            area_id: $validated['area_id'] ?? null,
        );

        try {
            $transaction = $this->transactionService->create($dto);

            return $this->successResponse(
                new SalesTransactionResource($transaction->load(['branch', 'sales', 'area', 'items'])),
                'Transaction created successfully',
                201
            );
        } catch (\App\Exceptions\InsufficientStockException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    /**
     * @OA\Get(
     *     path="/api/v1/transactions/{id}",
     *     tags={"Transactions"},
     *     summary="Get transaction by ID",
     *     description="Mendapatkan detail transaksi, Sales hanya bisa lihat transaksi sendiri",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Transaction ID",
     *         required=true,
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Transaction retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Transaction retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="customer_name", type="string", example="Toko Maju Jaya"),
     *                 @OA\Property(property="total", type="number", format="float", example=250000),
     *                 @OA\Property(
     *                     property="items",
     *                     type="array",
     *                     @OA\Items(
     *                         @OA\Property(property="product_name", type="string", example="Sampoerna Mild 16"),
     *                         @OA\Property(property="quantity", type="integer", example=10),
     *                         @OA\Property(property="price", type="number", format="float", example=25000)
     *                     )
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Unauthorized")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Transaction not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Transaction not found")
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
    public function show(int $id): JsonResponse
    {
        try {
            $transaction = $this->transactionService->getById($id);
        } catch (ModelNotFoundException $e) {
            return $this->errorResponse('Transaction not found', 404);
        }

        $user = auth()->user();

        // Sales can only view their own transactions
        if ($user->hasRole('Sales') && $transaction->sales_id !== $user->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse(
            new SalesTransactionResource($transaction->load(['branch', 'sales', 'area', 'items.product'])),
            'Transaction retrieved successfully'
        );
    }

    /**
     * @OA\Get(
     *     path="/api/v1/transactions/sales/{salesId}",
     *     tags={"Transactions"},
     *     summary="Get transactions by sales ID",
     *     description="Mendapatkan semua transaksi dari sales tertentu, Sales hanya bisa lihat transaksinya sendiri",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="salesId",
     *         in="path",
     *         description="Sales User ID",
     *         required=true,
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Transactions retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Transactions retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="customer_name", type="string", example="Toko Maju Jaya"),
     *                     @OA\Property(property="total", type="number", format="float", example=250000)
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Unauthorized")
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
    public function bySales(int $salesId): JsonResponse
    {
        $user = auth()->user();

        // Sales can only view their own transactions
        if ($user->hasRole('Sales') && $salesId !== $user->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $transactions = $this->transactionService->getPaginatedBySales($salesId);

        return $this->paginatedResponse(
            $transactions,
            SalesTransactionResource::class,
            'Transactions retrieved successfully'
        );
    }
}
