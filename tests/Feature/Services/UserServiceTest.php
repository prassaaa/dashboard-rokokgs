<?php

declare(strict_types=1);

use App\DataTransferObjects\UserDTO;
use App\Exceptions\BusinessException;
use App\Exceptions\DuplicateException;
use App\Exceptions\UnauthorizedActionException;
use App\Models\Area;
use App\Models\Branch;
use App\Models\User;
use App\Services\UserService;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->service = new UserService();
    $this->branch = Branch::factory()->create();

    // Create roles
    Role::create(['name' => 'Super Admin']);
    Role::create(['name' => 'Admin Cabang']);
    Role::create(['name' => 'Sales']);

    // Authenticate as Super Admin for tests (unless test overrides)
    $this->superAdmin = User::factory()->create(['branch_id' => $this->branch->id]);
    $this->superAdmin->assignRole('Super Admin');
    $this->actingAs($this->superAdmin);
});

test('can get all users', function () {
    User::factory()->count(5)->create();

    $users = $this->service->getAll();

    // 5 created + 1 super admin from beforeEach
    expect($users)->toHaveCount(6);
});

test('can filter users by branch', function () {
    $branch1 = Branch::factory()->create();
    $branch2 = Branch::factory()->create();

    User::factory()->count(3)->create(['branch_id' => $branch1->id]);
    User::factory()->count(2)->create(['branch_id' => $branch2->id]);

    $users = $this->service->getAll($branch1->id);

    expect($users)->toHaveCount(3);
});

test('can create new user', function () {
    $dto = new UserDTO(
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        branch_id: $this->branch->id,
        phone: '081234567890',
        roles: ['Sales']
    );

    $user = $this->service->create($dto);

    expect($user)
        ->name->toBe('Test User')
        ->email->toBe('test@example.com')
        ->branch_id->toBe($this->branch->id);

    expect($user->hasRole('Sales'))->toBeTrue();

    $this->assertDatabaseHas('users', [
        'email' => 'test@example.com',
    ]);
});

test('cannot create user with duplicate email', function () {
    User::factory()->create(['email' => 'duplicate@example.com']);

    $dto = new UserDTO(
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'password123',
        branch_id: $this->branch->id,
        phone: '081234567890',
        roles: ['Sales']
    );

    $this->service->create($dto);
})->throws(DuplicateException::class);

test('can update user', function () {
    $user = User::factory()->create(['name' => 'Old Name']);

    $dto = new UserDTO(
        name: 'New Name',
        email: $user->email,
        password: null,
        branch_id: $user->branch_id,
        phone: $user->phone,
        roles: []
    );

    $updated = $this->service->update($user->id, $dto);

    expect($updated->name)->toBe('New Name');
});

test('can delete user', function () {
    $user = User::factory()->create();

    $this->service->delete($user->id);

    $this->assertSoftDeleted('users', [
        'id' => $user->id,
    ]);
});

test('cannot delete self', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->service->delete($user->id);
})->throws(BusinessException::class);

test('can toggle user status', function () {
    $user = User::factory()->create(['is_active' => true]);

    $result = $this->service->toggleStatus($user->id);

    expect($result->is_active)->toBeFalse();
});

test('cannot deactivate self', function () {
    $user = User::factory()->create(['is_active' => true]);
    $this->actingAs($user);

    $this->service->toggleStatus($user->id);
})->throws(BusinessException::class);

test('can assign areas to sales user', function () {
    $user = User::factory()->create();
    $user->assignRole('Sales');

    $area1 = Area::factory()->create(['branch_id' => $this->branch->id]);
    $area2 = Area::factory()->create(['branch_id' => $this->branch->id]);

    $this->service->assignAreas($user->id, [$area1->id, $area2->id]);

    expect($user->fresh()->areas)->toHaveCount(2);
});

test('cannot assign areas to non-sales user', function () {
    $user = User::factory()->create();
    $user->assignRole('Admin Cabang');

    $area = Area::factory()->create();

    $this->service->assignAreas($user->id, [$area->id]);
})->throws(BusinessException::class);

test('can get sales by branch', function () {
    $branch = Branch::factory()->create();

    $sales1 = User::factory()->create(['branch_id' => $branch->id]);
    $sales1->assignRole('Sales');

    $sales2 = User::factory()->create(['branch_id' => $branch->id]);
    $sales2->assignRole('Sales');

    $admin = User::factory()->create(['branch_id' => $branch->id]);
    $admin->assignRole('Admin Cabang');

    $salesUsers = $this->service->getSalesByBranch($branch->id);

    expect($salesUsers)->toHaveCount(2);
});

test('super admin can access any branch', function () {
    $superAdmin = User::factory()->create();
    $superAdmin->assignRole('Super Admin');
    $this->actingAs($superAdmin);

    $branch = Branch::factory()->create();

    // Should succeed creating user for any branch
    $dto = new UserDTO(
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        roles: ['Sales'],
        branch_id: $branch->id,
        is_active: true
    );
    expect(fn () => $this->service->create($dto))->not->toThrow(UnauthorizedActionException::class);
});

test('admin cabang can only access their branch', function () {
    $branch1 = Branch::factory()->create();
    $branch2 = Branch::factory()->create();

    $admin = User::factory()->create(['branch_id' => $branch1->id]);
    $admin->assignRole('Admin Cabang');
    $this->actingAs($admin);

    // Should succeed creating user for own branch
    $dto = new UserDTO(
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        roles: ['Sales'],
        branch_id: $branch1->id,
        is_active: true
    );
    expect(fn () => $this->service->create($dto))->not->toThrow(UnauthorizedActionException::class);

    // Should fail creating user for other branch
    $dto2 = new UserDTO(
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123',
        roles: ['Sales'],
        branch_id: $branch2->id,
        is_active: true
    );
    expect(fn () => $this->service->create($dto2))->toThrow(UnauthorizedActionException::class);
});
