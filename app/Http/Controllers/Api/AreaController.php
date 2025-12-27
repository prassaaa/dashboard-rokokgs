<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Resources\AreaResource;
use App\Models\Area;
use Illuminate\Http\JsonResponse;

class AreaController extends BaseApiController
{
    /**
     * @OA\Get(
     *     path="/api/v1/areas",
     *     tags={"Areas"},
     *     summary="Get areas list",
     *     description="Sales melihat area yang di-assign ke mereka, Admin/Manager melihat semua area",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Areas retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Areas retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="name", type="string", example="Jakarta Selatan"),
     *                     @OA\Property(property="code", type="string", example="JKT-S"),
     *                     @OA\Property(property="description", type="string", example="Wilayah Jakarta Selatan"),
     *                     @OA\Property(property="is_active", type="boolean", example=true)
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
    public function index(): JsonResponse
    {
        $user = auth()->user();

        // Sales can only see their assigned areas
        if ($user->hasRole('Sales')) {
            $areas = $user->areas;
        } else {
            // Admin/Manager can see all areas
            $areas = Area::where('is_active', true)->orderBy('name')->get();
        }

        return $this->successResponse(
            AreaResource::collection($areas),
            'Areas retrieved successfully'
        );
    }

    /**
     * @OA\Get(
     *     path="/api/v1/areas/{id}",
     *     tags={"Areas"},
     *     summary="Get area by ID",
     *     description="Mendapatkan detail area berdasarkan ID",
     *     security={{"sanctum":{}}},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Area ID",
     *         required=true,
     *         @OA\Schema(type="integer", example=1)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Area retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Area retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="Jakarta Selatan"),
     *                 @OA\Property(property="code", type="string", example="JKT-S"),
     *                 @OA\Property(property="description", type="string", example="Wilayah Jakarta Selatan"),
     *                 @OA\Property(property="is_active", type="boolean", example=true)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Area not found",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Area not found")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Unauthenticated",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Unauthenticated.")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Unauthorized - Sales cannot access this area",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Unauthorized")
     *         )
     *     )
     * )
     */
    public function show(int $id): JsonResponse
    {
        $user = auth()->user();
        $area = Area::find($id);

        if (!$area) {
            return $this->errorResponse('Area not found', 404);
        }

        // Sales can only view their assigned areas
        if ($user->hasRole('Sales')) {
            $assignedAreaIds = $user->areas->pluck('id')->toArray();
            if (!in_array($id, $assignedAreaIds)) {
                return $this->errorResponse('Unauthorized', 403);
            }
        }

        return $this->successResponse(
            new AreaResource($area),
            'Area retrieved successfully'
        );
    }
}
