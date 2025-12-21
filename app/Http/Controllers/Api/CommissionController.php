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
     * @OA\Get(
     *     path="/api/v1/commissions",
     *     tags={"Commissions"},
     *     summary="Get commissions list",
     *     description="Hanya Sales yang bisa melihat komisi mereka sendiri",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         description="Filter by status (pending, approved, paid)",
     *         required=false,
     *         @OA\Schema(type="string", enum={"pending","approved","paid"}, example="approved")
     *     ),
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Page number",
     *         required=false,
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Commissions retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Commissions retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="transaction_amount", type="number", format="float", example=250000),
     *                     @OA\Property(property="commission_percentage", type="number", format="float", example=5),
     *                     @OA\Property(property="commission_amount", type="number", format="float", example=12500),
     *                     @OA\Property(property="status", type="string", example="approved")
     *                 )
     *             ),
     *             @OA\Property(
     *                 property="pagination",
     *                 type="object",
     *                 @OA\Property(property="total", type="integer", example=50),
     *                 @OA\Property(property="per_page", type="integer", example=20),
     *                 @OA\Property(property="current_page", type="integer", example=1)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - Only Sales can view commissions",
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
     * @OA\Get(
     *     path="/api/v1/commissions/summary",
     *     tags={"Commissions"},
     *     summary="Get commission summary",
     *     description="Mendapatkan ringkasan komisi Sales (total transaksi, total sales, total komisi)",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="start_date",
     *         in="query",
     *         description="Start date filter (Y-m-d)",
     *         required=false,
     *         @OA\Schema(type="string", format="date", example="2024-01-01")
     *     ),
     *     @OA\Parameter(
     *         name="end_date",
     *         in="query",
     *         description="End date filter (Y-m-d)",
     *         required=false,
     *         @OA\Schema(type="string", format="date", example="2024-12-31")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Commission summary retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Commission summary retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="total_transactions", type="integer", example=50),
     *                 @OA\Property(property="total_sales", type="number", format="float", example=5000000),
     *                 @OA\Property(property="total_commission", type="number", format="float", example=250000),
     *                 @OA\Property(property="average_transaction", type="number", format="float", example=100000)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - Only Sales can view commission summary",
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
