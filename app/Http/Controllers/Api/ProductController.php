<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends BaseApiController
{
    public function __construct(
        private readonly ProductService $productService
    ) {
    }

    /**
     * Get paginated products list.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        $isActive = $request->boolean('is_active', true);

        if ($search) {
            $products = $this->productService->search($search);

            return $this->successResponse(
                ProductResource::collection($products),
                'Products retrieved successfully'
            );
        }

        $products = $this->productService->getPaginated(
            perPage: 15,
            categoryId: $categoryId,
            activeOnly: $isActive
        );

        return $this->paginatedResponse(
            $products,
            ProductResource::class,
            'Products retrieved successfully'
        );
    }

    /**
     * Get product by ID.
     */
    public function show(int $id): JsonResponse
    {
        $product = $this->productService->getById($id);

        return $this->successResponse(
            new ProductResource($product),
            'Product retrieved successfully'
        );
    }

    /**
     * Get products by category.
     */
    public function byCategory(int $categoryId): JsonResponse
    {
        $products = $this->productService->getByCategory($categoryId);

        return $this->successResponse(
            ProductResource::collection($products),
            'Products retrieved successfully'
        );
    }
}
