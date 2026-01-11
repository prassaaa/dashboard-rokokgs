<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DataTransferObjects\VisitDTO;
use App\Http\Requests\Api\CreateVisitRequest;
use App\Http\Resources\VisitResource;
use App\Services\VisitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisitController extends BaseApiController
{
    public function __construct(
        private readonly VisitService $visitService
    ) {
    }

    /**
     * @OA\Get(
     *     path="/api/v1/visits",
     *     tags={"Visits"},
     *     summary="Get visits list",
     *     description="Sales melihat kunjungan sendiri, Admin/Manager melihat semua kunjungan di cabangnya",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="page",
     *         in="query",
     *         description="Page number",
     *         required=false,
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Parameter(
     *         name="status",
     *         in="query",
     *         description="Filter by status",
     *         required=false,
     *         @OA\Schema(type="string", enum={"pending", "approved", "rejected"})
     *     ),
     *     @OA\Parameter(
     *         name="visit_type",
     *         in="query",
     *         description="Filter by visit type",
     *         required=false,
     *         @OA\Schema(type="string", enum={"routine", "prospecting", "follow_up", "complaint", "other"})
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Visits retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Visits retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="visit_number", type="string", example="VST-20260111-0001"),
     *                     @OA\Property(property="customer_name", type="string", example="Toko Maju Jaya"),
     *                     @OA\Property(property="visit_type", type="string", example="routine"),
     *                     @OA\Property(property="status", type="string", example="pending")
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
        $branchId = $user->branch_id ? (int) $user->branch_id : null;

        // Sales can only see their own visits
        if ($user->hasRole('Sales')) {
            $visits = $this->visitService->getPaginated(
                branchId: $branchId,
                salesId: (int) $user->id,
                status: $request->input('status'),
                visitType: $request->input('visit_type'),
                startDate: $request->input('start_date'),
                endDate: $request->input('end_date'),
            );
        } else {
            // Admin/Manager can see all visits in their branch
            $visits = $this->visitService->getPaginated(
                branchId: $branchId,
                status: $request->input('status'),
                visitType: $request->input('visit_type'),
                startDate: $request->input('start_date'),
                endDate: $request->input('end_date'),
            );
        }

        return $this->paginatedResponse(
            $visits,
            VisitResource::class,
            'Visits retrieved successfully'
        );
    }

    /**
     * @OA\Post(
     *     path="/api/v1/visits",
     *     tags={"Visits"},
     *     summary="Create new visit",
     *     description="Sales membuat kunjungan baru",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\MediaType(
     *             mediaType="multipart/form-data",
     *             @OA\Schema(
     *                 required={"customer_name"},
     *                 @OA\Property(property="area_id", type="integer", example=1, description="Area ID where visit occurs"),
     *                 @OA\Property(property="customer_name", type="string", example="Toko Maju Jaya"),
     *                 @OA\Property(property="customer_phone", type="string", example="081234567890"),
     *                 @OA\Property(property="customer_address", type="string", example="Jl. Sudirman No. 123"),
     *                 @OA\Property(property="visit_type", type="string", enum={"routine", "prospecting", "follow_up", "complaint", "other"}, example="routine"),
     *                 @OA\Property(property="purpose", type="string", example="Pengecekan stok toko"),
     *                 @OA\Property(property="result", type="string", example="Toko masih memiliki stok cukup"),
     *                 @OA\Property(property="notes", type="string", example="Toko akan order minggu depan"),
     *                 @OA\Property(property="latitude", type="number", format="float", example=-6.200000),
     *                 @OA\Property(property="longitude", type="number", format="float", example=106.816666),
     *                 @OA\Property(property="photo", type="string", format="binary", description="Photo of the visit")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Visit created successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Visit created successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="visit_number", type="string", example="VST-20260111-0001"),
     *                 @OA\Property(property="customer_name", type="string", example="Toko Maju Jaya")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Validation error")
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
    public function store(CreateVisitRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = auth()->user();

        // Handle photo upload
        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('visits/photos', 'public');
        }

        $dto = new VisitDTO(
            branch_id: (int) $user->branch_id,
            sales_id: (int) $user->id,
            customer_name: $validated['customer_name'],
            customer_phone: $validated['customer_phone'] ?? null,
            customer_address: $validated['customer_address'] ?? null,
            visit_type: $validated['visit_type'] ?? 'routine',
            purpose: $validated['purpose'] ?? null,
            result: $validated['result'] ?? null,
            notes: $validated['notes'] ?? null,
            latitude: isset($validated['latitude']) ? (float) $validated['latitude'] : null,
            longitude: isset($validated['longitude']) ? (float) $validated['longitude'] : null,
            area_id: isset($validated['area_id']) ? (int) $validated['area_id'] : null,
            photo: $photoPath,
        );

        $visit = $this->visitService->create($dto);

        return $this->successResponse(
            new VisitResource($visit->load(['branch', 'sales', 'area'])),
            'Visit created successfully',
            201
        );
    }

    /**
     * @OA\Get(
     *     path="/api/v1/visits/{id}",
     *     tags={"Visits"},
     *     summary="Get visit detail",
     *     description="Get detail of a specific visit",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Visit ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Visit retrieved successfully"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Visit not found"
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Forbidden"
     *     )
     * )
     */
    public function show(int $id): JsonResponse
    {
        $user = auth()->user();

        $visit = $this->visitService->getById($id);

        // Check if user can view this visit
        if ($user->hasRole('Sales') && $visit->sales_id !== $user->id) {
            return $this->errorResponse('You can only view your own visits', 403);
        }

        if (!$user->hasRole(['Super Admin', 'Sales']) && $visit->branch_id !== $user->branch_id) {
            return $this->errorResponse('You can only view visits in your branch', 403);
        }

        $visit->load(['branch', 'sales', 'area', 'approver']);

        return $this->successResponse(
            new VisitResource($visit),
            'Visit retrieved successfully'
        );
    }

    /**
     * @OA\Get(
     *     path="/api/v1/visits/sales/{salesId}",
     *     tags={"Visits"},
     *     summary="Get visits by sales",
     *     description="Get all visits for a specific sales user",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="salesId",
     *         in="path",
     *         description="Sales User ID",
     *         required=true,
     *         @OA\Schema(type="integer")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Visits retrieved successfully"
     *     )
     * )
     */
    public function bySales(int $salesId): JsonResponse
    {
        $user = auth()->user();

        // Sales can only see their own visits
        if ($user->hasRole('Sales') && $user->id !== $salesId) {
            return $this->errorResponse('You can only view your own visits', 403);
        }

        $visits = $this->visitService->getPaginated(
            branchId: $user->branch_id ? (int) $user->branch_id : null,
            salesId: $salesId
        );

        return $this->paginatedResponse(
            $visits,
            VisitResource::class,
            'Visits retrieved successfully'
        );
    }

    /**
     * @OA\Get(
     *     path="/api/v1/visits/statistics",
     *     tags={"Visits"},
     *     summary="Get visit statistics",
     *     description="Get visit statistics for current user",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Statistics retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="total", type="integer", example=100),
     *                 @OA\Property(property="pending", type="integer", example=10),
     *                 @OA\Property(property="approved", type="integer", example=85),
     *                 @OA\Property(property="rejected", type="integer", example=5),
     *                 @OA\Property(property="today", type="integer", example=5),
     *                 @OA\Property(property="this_week", type="integer", example=20),
     *                 @OA\Property(property="this_month", type="integer", example=50)
     *             )
     *         )
     *     )
     * )
     */
    public function statistics(): JsonResponse
    {
        $user = auth()->user();

        $statistics = $this->visitService->getStatistics(
            branchId: $user->branch_id ? (int) $user->branch_id : null,
            salesId: $user->hasRole('Sales') ? (int) $user->id : null
        );

        return $this->successResponse($statistics, 'Statistics retrieved successfully');
    }
}
