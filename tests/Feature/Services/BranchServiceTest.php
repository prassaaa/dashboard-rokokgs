<?php

declare(strict_types=1);

use App\DataTransferObjects\BranchDTO;
use App\Exceptions\DuplicateException;
use App\Models\Branch;
use App\Services\BranchService;

beforeEach(function () {
    $this->service = new BranchService();
});

test('can get all branches', function () {
    Branch::factory()->count(3)->create();

    $branches = $this->service->getAll();

    expect($branches)->toHaveCount(3);
});

test('can get branch by id', function () {
    $branch = Branch::factory()->create(['name' => 'Test Branch']);

    $result = $this->service->getById($branch->id);

    expect($result->name)->toBe('Test Branch');
});

test('can create new branch', function () {
    $dto = new BranchDTO(
        code: 'TST-01',
        name: 'Test Branch',
        address: 'Test Address',
        city: 'Test City',
        province: 'Test Province',
        phone: '081234567890',
        email: 'test@branch.com',
        is_active: true
    );

    $branch = $this->service->create($dto);

    expect($branch)
        ->code->toBe('TST-01')
        ->name->toBe('Test Branch')
        ->is_active->toBeTrue();

    $this->assertDatabaseHas('branches', [
        'code' => 'TST-01',
        'name' => 'Test Branch',
    ]);
});

test('cannot create branch with duplicate code', function () {
    Branch::factory()->create(['code' => 'DUP-01']);

    $dto = new BranchDTO(
        code: 'DUP-01',
        name: 'Duplicate Branch',
        address: 'Test Address',
        city: 'Test City',
        province: 'Test Province',
        phone: '081234567890',
        email: 'test@branch.com',
        is_active: true
    );

    $this->service->create($dto);
})->throws(DuplicateException::class);

test('can update branch', function () {
    $branch = Branch::factory()->create(['name' => 'Old Name']);

    $dto = new BranchDTO(
        code: $branch->code,
        name: 'New Name',
        address: $branch->address,
        city: $branch->city,
        province: $branch->province,
        phone: $branch->phone,
        email: $branch->email,
        is_active: $branch->is_active
    );

    $updated = $this->service->update($branch->id, $dto);

    expect($updated->name)->toBe('New Name');

    $this->assertDatabaseHas('branches', [
        'id' => $branch->id,
        'name' => 'New Name',
    ]);
});

test('can delete branch', function () {
    $branch = Branch::factory()->create();

    $this->service->delete($branch->id);

    $this->assertSoftDeleted('branches', [
        'id' => $branch->id,
    ]);
});

test('can toggle branch status', function () {
    $branch = Branch::factory()->create(['is_active' => true]);

    $result = $this->service->toggleStatus($branch->id);

    expect($result->is_active)->toBeFalse();

    $this->assertDatabaseHas('branches', [
        'id' => $branch->id,
        'is_active' => false,
    ]);
});

test('can get branches with statistics', function () {
    $branch = Branch::factory()->create();

    // Create some test data
    \App\Models\User::factory()->create(['branch_id' => $branch->id]);
    \App\Models\Product::factory()->create();
    \App\Models\Stock::factory()->create(['branch_id' => $branch->id]);

    $branches = $this->service->getBranchesWithStats();

    expect($branches)->toHaveCount(1)
        ->and($branches->first())
        ->users_count->toBeGreaterThanOrEqual(1)
        ->stocks_count->toBeGreaterThanOrEqual(1);
});
