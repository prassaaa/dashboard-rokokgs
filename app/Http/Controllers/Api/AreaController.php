<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Resources\AreaResource;
use App\Models\Area;
use Illuminate\Http\JsonResponse;

class AreaController extends BaseApiController
{
    /**
     * Get all areas.
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
     * Get area by ID.
     */
    public function show(int $id): JsonResponse
    {
        $area = Area::findOrFail($id);

        return $this->successResponse(
            new AreaResource($area),
            'Area retrieved successfully'
        );
    }
}
