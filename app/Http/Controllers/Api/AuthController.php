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
     * @OA\Post(
     *     path="/api/v1/login",
     *     tags={"Authentication"},
     *     summary="Login user dan generate token",
     *     description="Authenticate user dengan email dan password, return user data dan bearer token",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"email","password"},
     *             @OA\Property(property="email", type="string", format="email", example="admin@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="password")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Login successful"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(
     *                     property="user",
     *                     type="object",
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="name", type="string", example="Admin User"),
     *                     @OA\Property(property="email", type="string", example="admin@example.com")
     *                 ),
     *                 @OA\Property(property="token", type="string", example="1|xxxxxxxxxxxxxxxxxxx")
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Invalid credentials",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Invalid credentials")
     *         )
     *     ),
     *     @OA\Response(
     *         response=403,
     *         description="Account is inactive",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="Account is inactive")
     *         )
     *     )
     * )
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

        // Check if user's branch is active
        if ($user->branch_id && $user->branch && !$user->branch->is_active) {
            Auth::logout();

            return $this->errorResponse('Cabang Anda telah dinonaktifkan. Silakan hubungi Admin.', 403);
        }

        // Create token
        $token = $user->createToken('api-token')->plainTextToken;

        return $this->successResponse([
            'user' => new UserResource($user->load(['branch', 'roles', 'areas'])),
            'token' => $token,
        ], 'Login successful');
    }

    /**
     * @OA\Post(
     *     path="/api/v1/register",
     *     tags={"Authentication"},
     *     summary="Register user baru (Sales only)",
     *     description="Registrasi user baru untuk Sales melalui mobile app, memerlukan approval admin",
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email","password","password_confirmation","branch_id"},
     *             @OA\Property(property="name", type="string", example="Sales User"),
     *             @OA\Property(property="email", type="string", format="email", example="sales@example.com"),
     *             @OA\Property(property="password", type="string", format="password", example="password123"),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="password123"),
     *             @OA\Property(property="phone", type="string", example="081234567890"),
     *             @OA\Property(property="branch_id", type="integer", example=1)
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Registration successful, waiting approval",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Registration successful. Please wait for admin approval."),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=2),
     *                 @OA\Property(property="name", type="string", example="Sales User"),
     *                 @OA\Property(property="email", type="string", example="sales@example.com"),
     *                 @OA\Property(property="is_active", type="boolean", example=false)
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="The email has already been taken.")
     *         )
     *     )
     * )
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
     * @OA\Get(
     *     path="/api/v1/profile",
     *     tags={"Authentication"},
     *     summary="Get user profile",
     *     description="Mendapatkan data profil user yang sedang login beserta branch, roles, dan areas",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Profile retrieved successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Profile retrieved successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="Admin User"),
     *                 @OA\Property(property="email", type="string", example="admin@example.com"),
     *                 @OA\Property(property="phone", type="string", example="081234567890"),
     *                 @OA\Property(property="is_active", type="boolean", example=true),
     *                 @OA\Property(
     *                     property="branch",
     *                     type="object",
     *                     @OA\Property(property="id", type="integer", example=1),
     *                     @OA\Property(property="name", type="string", example="Cabang Jakarta")
     *                 ),
     *                 @OA\Property(
     *                     property="roles",
     *                     type="array",
     *                     @OA\Items(type="string", example="Admin")
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
    public function profile(): JsonResponse
    {
        $user = Auth::user()->load(['branch', 'roles', 'areas']);

        return $this->successResponse(
            new UserResource($user),
            'Profile retrieved successfully'
        );
    }

    /**
     * @OA\Put(
     *     path="/api/v1/profile",
     *     tags={"Authentication"},
     *     summary="Update user profile",
     *     description="Update data profil user yang sedang login (nama, email, phone, password, avatar)",
     *     security={{"sanctum":{}}},
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             required={"name","email"},
     *             @OA\Property(property="name", type="string", example="Updated Name"),
     *             @OA\Property(property="email", type="string", format="email", example="newemail@example.com"),
     *             @OA\Property(property="phone", type="string", example="081234567890"),
     *             @OA\Property(property="password", type="string", format="password", example="newpassword123"),
     *             @OA\Property(property="password_confirmation", type="string", format="password", example="newpassword123"),
     *             @OA\Property(property="avatar", type="string", format="binary", description="Avatar image file")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Profile updated successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Profile updated successfully"),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="integer", example=1),
     *                 @OA\Property(property="name", type="string", example="Updated Name"),
     *                 @OA\Property(property="email", type="string", example="newemail@example.com")
     *             )
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
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=false),
     *             @OA\Property(property="message", type="string", example="The email has already been taken.")
     *         )
     *     )
     * )
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
     * @OA\Post(
     *     path="/api/v1/logout",
     *     tags={"Authentication"},
     *     summary="Logout user",
     *     description="Logout user dan revoke token yang sedang digunakan",
     *     security={{"sanctum":{}}},
     *     @OA\Response(
     *         response=200,
     *         description="Logout successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(property="message", type="string", example="Logout successful"),
     *             @OA\Property(property="data", type="null")
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
    public function logout(): JsonResponse
    {
        Auth::user()->currentAccessToken()->delete();

        return $this->successResponse(null, 'Logout successful');
    }
}
