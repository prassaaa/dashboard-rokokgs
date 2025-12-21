<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DataTransferObjects\SalesTransactionDTO;
use App\Http\Requests\Api\CreateTransactionRequest;
use App\Http\Resources\SalesTransactionResource;
use App\Services\SalesTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends BaseApiController
{
    public function __construct(
        private readonly SalesTransactionService $transactionService
    ) {
    }

    /**
     * Get transactions for authenticated sales user.
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
     * Create new transaction.
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
            latitude: $validated['latitude'] ?? null,
            longitude: $validated['longitude'] ?? null,
            items: $validated['items'],
            subtotal: $validated['subtotal'],
            discount: $validated['discount'] ?? 0,
            tax: $validated['tax'] ?? 0,
            total: $validated['total'],
            payment_method: $validated['payment_method'],
            notes: $validated['notes'] ?? null,
        );

        try {
            $transaction = $this->transactionService->create($dto);

            return $this->successResponse(
                new SalesTransactionResource($transaction->load(['branch', 'sales', 'items'])),
                'Transaction created successfully',
                201
            );
        } catch (\App\Exceptions\InsufficientStockException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    /**
     * Get transaction by ID.
     */
    public function show(int $id): JsonResponse
    {
        $transaction = $this->transactionService->getById($id);
        $user = auth()->user();

        // Sales can only view their own transactions
        if ($user->hasRole('Sales') && $transaction->sales_id !== $user->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        return $this->successResponse(
            new SalesTransactionResource($transaction->load(['branch', 'sales', 'items.product'])),
            'Transaction retrieved successfully'
        );
    }

    /**
     * Get transactions by sales ID.
     */
    public function bySales(int $salesId): JsonResponse
    {
        $user = auth()->user();

        // Sales can only view their own transactions
        if ($user->hasRole('Sales') && $salesId !== $user->id) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $transactions = $this->transactionService->getBySales($salesId);

        return $this->successResponse(
            SalesTransactionResource::collection($transactions),
            'Transactions retrieved successfully'
        );
    }
}
