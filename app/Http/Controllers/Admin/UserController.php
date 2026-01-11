<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\UserDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Area;
use App\Models\Branch;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService
    ) {
    }

    /**
     * Display users list.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $query = User::with(['branch:id,name', 'roles', 'areas:id,name'])
            ->orderByDesc('created_at');

        // Admin Cabang can only see users in their branch
        if (!$isSuperAdmin) {
            $query->where('branch_id', $user->branch_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $isActive = $request->input('status') === 'active';
            $query->where('is_active', $isActive);
        }

        // Filter by role
        if ($request->has('role')) {
            $query->role($request->input('role'));
        }

        // Search by name or email
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate(15);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['status', 'role', 'search']),
        ]);
    }

    /**
     * Show create user form.
     */
    public function create(): Response
    {
        $user = auth()->user();
        $isSuperAdmin = $user->hasRole('Super Admin');

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $user->branch_id)->get(['id', 'name']);

        $areas = Area::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Users/Create', [
            'branches' => $branches,
            'areas' => $areas,
            'availableRoles' => $this->getAvailableRoles($isSuperAdmin),
        ]);
    }

    /**
     * Store new user.
     */
    public function store(CreateUserRequest $request): RedirectResponse
    {
        $currentUser = auth()->user();

        // Check if user has permission to create users
        if (!$currentUser->can('create-users')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validated();

        // Admin Cabang can only create users for their branch
        if (!$currentUser->hasRole('Super Admin') && (int) $validated['branch_id'] !== (int) $currentUser->branch_id) {
            abort(403, 'You can only create users for your branch');
        }

        // Prevent privilege escalation: Admin Cabang cannot create Super Admin or Admin Cabang
        if (!$currentUser->hasRole('Super Admin') && isset($validated['roles'])) {
            $allowedRoles = ['Sales']; // Admin Cabang can only create Sales
            foreach ($validated['roles'] as $role) {
                if (!in_array($role, $allowedRoles)) {
                    abort(403, 'You cannot create users with this role');
                }
            }
        }

        $dto = new UserDTO(
            name: $validated['name'],
            email: $validated['email'],
            password: $validated['password'],
            phone: $validated['phone'] ?? null,
            branch_id: $validated['branch_id'],
            roles: $validated['roles'],
            areas: $validated['areas'] ?? [],
            is_active: $validated['is_active'] ?? true,
        );

        $user = $this->userService->create($dto);

        return redirect()->route('admin.users.index')
            ->with('success', 'User created successfully');
    }

    /**
     * Show edit user form.
     */
    public function edit(int $id): Response
    {
        $currentUser = auth()->user();
        $isSuperAdmin = $currentUser->hasRole('Super Admin');

        $user = User::with(['branch', 'roles', 'areas'])->findOrFail($id);

        // Admin Cabang can only edit users in their branch
        if (!$isSuperAdmin && (int) $user->branch_id !== (int) $currentUser->branch_id) {
            abort(403, 'Unauthorized');
        }

        $branches = $isSuperAdmin
            ? Branch::where('is_active', true)->orderBy('name')->get(['id', 'name'])
            : Branch::where('id', $currentUser->branch_id)->get(['id', 'name']);

        $areas = Area::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'branch_id' => $user->branch_id,
                'is_active' => $user->is_active,
                'roles' => $user->roles->pluck('name')->toArray(),
                'areas' => $user->areas->pluck('id')->toArray(),
            ],
            'branches' => $branches,
            'areas' => $areas,
            'availableRoles' => $this->getAvailableRoles($isSuperAdmin),
        ]);
    }

    /**
     * Update user.
     */
    public function update(UpdateUserRequest $request, int $id): RedirectResponse
    {
        $currentUser = auth()->user();

        // Check if user has permission to edit users
        if (!$currentUser->can('edit-users')) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validated();

        $userToUpdate = User::findOrFail($id);

        // Admin Cabang can only edit users in their branch
        if (!$currentUser->hasRole('Super Admin') && (int) $userToUpdate->branch_id !== (int) $currentUser->branch_id) {
            abort(403, 'You can only edit users in your branch');
        }

        // Prevent privilege escalation: Admin Cabang cannot assign Super Admin role
        if (!$currentUser->hasRole('Super Admin') && isset($validated['roles'])) {
            $allowedRoles = ['Sales']; // Admin Cabang can only assign Sales role
            foreach ($validated['roles'] as $role) {
                if (!in_array($role, $allowedRoles)) {
                    abort(403, 'You cannot assign this role');
                }
            }
        }

        $dto = new UserDTO(
            name: $validated['name'],
            email: $validated['email'],
            password: $validated['password'] ?? null,
            phone: $validated['phone'] ?? null,
            branch_id: $validated['branch_id'],
            roles: $validated['roles'] ?? null,
            areas: $validated['areas'] ?? null,
            is_active: $validated['is_active'] ?? null,
        );

        $this->userService->update($id, $dto);

        return redirect()->route('admin.users.index')
            ->with('success', 'User updated successfully');
    }

    /**
     * Delete user.
     */
    public function destroy(int $id): RedirectResponse
    {
        $currentUser = auth()->user();
        $userToDelete = User::findOrFail($id);

        // Cannot delete self
        if ($userToDelete->id === $currentUser->id) {
            return redirect()->back()
                ->with('error', 'Cannot delete your own account');
        }

        // Admin Cabang can only delete users in their branch
        if (!$currentUser->hasRole('Super Admin') && (int) $userToDelete->branch_id !== (int) $currentUser->branch_id) {
            abort(403, 'Unauthorized');
        }

        $this->userService->delete($id);

        return redirect()->route('admin.users.index')
            ->with('success', 'User deleted successfully');
    }

    /**
     * Approve pending user registration.
     */
    public function approve(int $id): RedirectResponse
    {
        $currentUser = auth()->user();

        // Check if user has permission to create/edit users
        if (!$currentUser->can('create-users') && !$currentUser->can('edit-users')) {
            abort(403, 'Unauthorized');
        }

        $user = User::findOrFail($id);

        // Admin Cabang can only approve users in their branch
        if (!$currentUser->hasRole('Super Admin') && (int) $user->branch_id !== (int) $currentUser->branch_id) {
            abort(403, 'You can only approve users in your branch');
        }

        $dto = new UserDTO(
            name: $user->name,
            email: $user->email,
            phone: $user->phone,
            branch_id: $user->branch_id,
            is_active: true,
        );

        $this->userService->update($id, $dto);

        return redirect()->back()
            ->with('success', 'User approved successfully');
    }

    /**
     * Assign areas to user.
     */
    public function assignAreas(Request $request, int $id): RedirectResponse
    {
        $currentUser = auth()->user();

        // Check if user has permission to assign sales areas
        if (!$currentUser->can('assign-sales-area')) {
            abort(403, 'Unauthorized');
        }

        $request->validate([
            'areas' => 'required|array',
            'areas.*' => 'exists:areas,id',
        ]);

        $user = User::findOrFail($id);

        // Admin Cabang can only assign areas to users in their branch
        if (!$currentUser->hasRole('Super Admin') && (int) $user->branch_id !== (int) $currentUser->branch_id) {
            abort(403, 'You can only assign areas to users in your branch');
        }

        $user->areas()->sync($request->input('areas'));

        return redirect()->back()
            ->with('success', 'Areas assigned successfully');
    }

    /**
     * Get available roles based on user permissions.
     */
    private function getAvailableRoles(bool $isSuperAdmin): array
    {
        if ($isSuperAdmin) {
            return ['Super Admin', 'Admin Cabang', 'Sales'];
        }

        return ['Sales']; // Admin Cabang can only create Sales
    }
}
