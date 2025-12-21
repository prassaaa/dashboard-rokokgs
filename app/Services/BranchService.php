<?php

declare(strict_types=1);

namespace App\Services;

use App\DataTransferObjects\BranchDTO;
use App\Exceptions\DuplicateException;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Collection;

class BranchService extends BaseService
{
    /**
     * Get all branches.
     */
    public function getAll(bool $activeOnly = false): Collection
    {
        $query = Branch::query();

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        return $query->orderBy('name')->get();
    }

    /**
     * Get branch by ID.
     */
    public function getById(int $id): Branch
    {
        return $this->findOrFail(Branch::class, $id);
    }

    /**
     * Create a new branch.
     *
     * @throws DuplicateException
     */
    public function create(BranchDTO $dto): Branch
    {
        return $this->executeInTransaction(function () use ($dto) {
            // Check for duplicate code
            if (Branch::where('code', $dto->code)->exists()) {
                throw new DuplicateException('branch code', $dto->code);
            }

            $branch = Branch::create($dto->toArray());

            $this->logAction('Branch created', [
                'branch_id' => $branch->id,
                'code' => $branch->code,
            ]);

            return $branch;
        });
    }

    /**
     * Update an existing branch.
     *
     * @throws DuplicateException
     */
    public function update(int $id, BranchDTO $dto): Branch
    {
        return $this->executeInTransaction(function () use ($id, $dto) {
            $branch = $this->getById($id);

            // Check for duplicate code (excluding current branch)
            if (Branch::where('code', $dto->code)
                ->where('id', '!=', $id)
                ->exists()
            ) {
                throw new DuplicateException('branch code', $dto->code);
            }

            $branch->update($dto->toArray());

            $this->logAction('Branch updated', [
                'branch_id' => $branch->id,
                'code' => $branch->code,
            ]);

            return $branch->fresh();
        });
    }

    /**
     * Delete a branch (soft delete).
     */
    public function delete(int $id): bool
    {
        return $this->executeInTransaction(function () use ($id) {
            $branch = $this->getById($id);

            $deleted = $branch->delete();

            $this->logAction('Branch deleted', [
                'branch_id' => $id,
                'code' => $branch->code,
            ]);

            return $deleted;
        });
    }

    /**
     * Toggle branch active status.
     */
    public function toggleStatus(int $id): Branch
    {
        return $this->executeInTransaction(function () use ($id) {
            $branch = $this->getById($id);
            $branch->is_active = !$branch->is_active;
            $branch->save();

            $this->logAction('Branch status toggled', [
                'branch_id' => $id,
                'is_active' => $branch->is_active,
            ]);

            return $branch;
        });
    }

    /**
     * Get branches with statistics.
     */
    public function getBranchesWithStats(): Collection
    {
        return Branch::withCount([
            'users',
            'salesTransactions',
            'stocks',
        ])->get();
    }
}
