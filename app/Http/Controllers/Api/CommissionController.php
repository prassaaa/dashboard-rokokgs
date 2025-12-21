<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Resources\CommissionResource;
use App\Models\Commission;
use App\Services\SalesTransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionController extends BaseApiController
{
    public function __construct(
        private readonly SalesTransactionService $transactionService
    ) {
    }

    /**
     * Get commissions for authenticated sales user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        // Only sales can view commissions
        if (!$user->hasRole('Sales')) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $status = $request->input('status'); // pending, approved, paid

        $query = Commission::where('sales_id', $user->id)
            ->with(['salesTransaction'])
            ->orderByDesc('created_at');

        if ($status) {
            $query->where('status', $status);
        }

        $commissions = $query->paginate(20);

        return $this->paginatedResponse(
            $commissions,
            CommissionResource::class,
            'Commissions retrieved successfully'
        );
    }

    /**
     * Get commission summary for authenticated sales user.
     */
    public function summary(Request $request): JsonResponse
    {
        $user = auth()->user();

        // Only sales can view commission summary
        if (!$user->hasRole('Sales')) {
            return $this->errorResponse('Unauthorized', 403);
        }

        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $summary = $this->transactionService->getSalesSummary(
            $user->id,
            $startDate,
            $endDate
        );

        return $this->successResponse($summary, 'Commission summary retrieved successfully');
    }
}
