<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\DataTransferObjects\UserDTO;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\RegisterRequest;
use App\Http\Requests\Api\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends BaseApiController
{
    public function __construct(
        private readonly UserService $userService
    ) {
    }

    /**
     * Login user and create token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->validated();

        if (!Auth::attempt($credentials)) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        $user = Auth::user();

        // Check if user is active
        if (!$user->is_active) {
            Auth::logout();

            return $this->errorResponse('Account is inactive', 403);
        }

        // Create token
        $token = $user->createToken('api-token')->plainTextToken;

        return $this->successResponse([
            'user' => new UserResource($user->load(['branch', 'roles', 'areas'])),
            'token' => $token,
        ], 'Login successful');
    }

    /**
     * Register new user (Sales only via mobile).
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $dto = new UserDTO(
            name: $validated['name'],
            email: $validated['email'],
            password: $validated['password'],
            phone: $validated['phone'] ?? null,
            branch_id: $validated['branch_id'],
            roles: ['Sales'], // Mobile registration is only for Sales
            is_active: false, // Require admin approval
        );

        $user = $this->userService->create($dto);

        return $this->successResponse(
            new UserResource($user),
            'Registration successful. Please wait for admin approval.',
            201
        );
    }

    /**
     * Get authenticated user profile.
     */
    public function profile(): JsonResponse
    {
        $user = Auth::user()->load(['branch', 'roles', 'areas']);

        return $this->successResponse(
            new UserResource($user),
            'Profile retrieved successfully'
        );
    }

    /**
     * Update user profile.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $userId = Auth::id();

        $dto = new UserDTO(
            name: $validated['name'],
            email: $validated['email'],
            password: $validated['password'] ?? null,
            phone: $validated['phone'] ?? null,
            branch_id: Auth::user()->branch_id,
            avatar: $validated['avatar'] ?? null,
        );

        $user = $this->userService->update($userId, $dto);

        return $this->successResponse(
            new UserResource($user),
            'Profile updated successfully'
        );
    }

    /**
     * Logout user and revoke token.
     */
    public function logout(): JsonResponse
    {
        Auth::user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logout successful');
    }
}
