<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\UserDTO;
use App\Exceptions\DuplicateException;
use App\Exceptions\UnauthorizedActionException;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class UserService extends BaseService
{
    /**
     * Get all users.
     */
    public function getAll(?int $branchId = null, ?string $role = null): Collection
    {
        $query = User::with(['branch', 'roles']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($role) {
            $query->role($role);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Get user by ID.
     */
    public function getById(int $id): User
    {
        return User::with(['branch', 'roles', 'areas'])->findOrFail($id);
    }

    /**
     * Create a new user.
     *
     * @throws DuplicateException
     * @throws UnauthorizedActionException
     */
    public function create(UserDTO $dto): User
    {
        return $this->executeInTransaction(function () use ($dto) {
            // Check for duplicate email
            if (User::where('email', $dto->email)->exists()) {
                throw new DuplicateException('email', $dto->email);
            }

            // Validate branch access if creating user for specific branch
            if ($dto->branch_id) {
                $this->validateBranchAccess($dto->branch_id);
            }

            $userData = $dto->toArray();
            unset($userData['roles']); // Handle roles separately
            unset($userData['areas']); // Handle areas separately

            $userData['password'] = Hash::make($dto->password);

            $user = User::create($userData);

            // Assign roles
            if ($dto->roles) {
                $user->assignRole($dto->roles);
            }

            // Sync areas if provided
            if ($dto->areas) {
                $user->areas()->sync($dto->areas);
            }

            $this->logAction('User created', [
                'user_id' => $user->id,
                'email' => $user->email,
                'roles' => $dto->roles,
            ]);

            return $user->load(['branch', 'roles', 'areas']);
        });
    }

    /**
     * Update an existing user.
     *
     * @throws DuplicateException
     */
    public function update(int $id, UserDTO $dto): User
    {
        return $this->executeInTransaction(function () use ($id, $dto) {
            $user = $this->getById($id);

            // Check for duplicate email (excluding current user)
            if (User::where('email', $dto->email)
                ->where('id', '!=', $id)
                ->exists()
            ) {
                throw new DuplicateException('email', $dto->email);
            }

            // Validate branch access if updating branch
            if ($dto->branch_id) {
                $this->validateBranchAccess($dto->branch_id);
            }

            $userData = $dto->toArray();
            unset($userData['roles']); // Handle roles separately
            unset($userData['areas']); // Handle areas separately

            // Only update password if provided
            if ($dto->password) {
                $userData['password'] = Hash::make($dto->password);
            } else {
                unset($userData['password']);
            }

            $user->update($userData);

            // Update roles if provided
            if ($dto->roles) {
                $user->syncRoles($dto->roles);
            }

            // Sync areas if provided
            if ($dto->areas !== null) {
                $user->areas()->sync($dto->areas);
            }

            $this->logAction('User updated', [
                'user_id' => $user->id,
                'email' => $user->email,
            ]);

            return $user->fresh(['branch', 'roles', 'areas']);
        });
    }

    /**
     * Delete a user (soft delete).
     */
    public function delete(int $id): bool
    {
        return $this->executeInTransaction(function () use ($id) {
            $user = $this->getById($id);

            // Prevent deleting own account
            if ($user->id === auth()->id()) {
                throw new UnauthorizedActionException('delete your own account');
            }

            $deleted = $user->delete();

            $this->logAction('User deleted', [
                'user_id' => $id,
                'email' => $user->email,
            ]);

            return $deleted;
        });
    }

    /**
     * Toggle user active status.
     */
    public function toggleStatus(int $id): User
    {
        return $this->executeInTransaction(function () use ($id) {
            $user = $this->getById($id);

            // Prevent deactivating own account
            if ($user->id === auth()->id()) {
                throw new UnauthorizedActionException('deactivate your own account');
            }

            $user->is_active = !$user->is_active;
            $user->save();

            $this->logAction('User status toggled', [
                'user_id' => $id,
                'is_active' => $user->is_active,
            ]);

            return $user;
        });
    }

    /**
     * Assign areas to a sales user.
     */
    public function assignAreas(int $userId, array $areaIds): User
    {
        return $this->executeInTransaction(function () use ($userId, $areaIds) {
            $user = $this->getById($userId);

            // Ensure user is a sales
            if (!$user->hasRole('Sales')) {
                throw new UnauthorizedActionException('assign areas to non-sales users');
            }

            $user->areas()->sync($areaIds);

            $this->logAction('Areas assigned to sales', [
                'user_id' => $userId,
                'area_ids' => $areaIds,
            ]);

            return $user->fresh('areas');
        });
    }

    /**
     * Get sales users by branch.
     */
    public function getSalesByBranch(int $branchId): Collection
    {
        return User::role('Sales')
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
    }

    /**
     * Validate branch access based on user role.
     */
    private function validateBranchAccess(int $branchId): void
    {
        $currentUser = auth()->user();

        // Fail secure: require authenticated user
        if (!$currentUser) {
            throw new UnauthorizedActionException('access this resource without authentication');
        }

        // Super Admin can access all branches
        if ($currentUser->hasRole('Super Admin')) {
            return;
        }

        // Admin Cabang can only manage users in their branch
        if ($currentUser->hasRole('Admin Cabang') && $currentUser->branch_id !== $branchId) {
            throw new UnauthorizedActionException('manage users in other branches');
        }
    }
}
