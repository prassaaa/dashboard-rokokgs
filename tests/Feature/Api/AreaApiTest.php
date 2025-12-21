<?php

declare(strict_types=1);

use App\Models\Area;
use App\Models\Branch;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Create roles
    Role::firstOrCreate(['name' => 'Sales', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Admin Cabang', 'guard_name' => 'web']);

    // Create branch
    $this->branch = Branch::factory()->create([
        'name' => 'Branch Jakarta',
        'is_active' => true,
    ]);

    // Create areas
    $this->area1 = Area::create([
        'name' => 'Jakarta Utara',
        'code' => 'JKT-UT',
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);

    $this->area2 = Area::create([
        'name' => 'Jakarta Selatan',
        'code' => 'JKT-SEL',
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);

    $this->area3 = Area::create([
        'name' => 'Jakarta Barat',
        'code' => 'JKT-BAR',
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);

    $this->inactiveArea = Area::create([
        'name' => 'Inactive Area',
        'code' => 'INACTIVE',
        'branch_id' => $this->branch->id,
        'is_active' => false,
    ]);

    // Create sales user with assigned areas
    $this->salesUser = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->salesUser->assignRole('Sales');
    // Assign area1 and area2 to sales user
    $this->salesUser->areas()->attach([$this->area1->id, $this->area2->id]);

    // Create admin user
    $this->adminUser = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->adminUser->assignRole('Admin Cabang');
});

test('sales can get their assigned areas', function () {
    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/areas');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'code',
                ],
            ],
        ]);

    // Should only see assigned areas
    $areas = collect($response->json('data'));
    expect($areas)->toHaveCount(2);
    expect($areas->pluck('id')->toArray())->toContain($this->area1->id, $this->area2->id);
    expect($areas->pluck('id')->toArray())->not->toContain($this->area3->id);
});

test('admin can see all active areas', function () {
    $response = $this->actingAs($this->adminUser, 'sanctum')
        ->getJson('/api/v1/areas');

    $response->assertOk();

    // Should see all active areas (not inactive)
    $areas = collect($response->json('data'));
    expect($areas)->toHaveCount(3); // area1, area2, area3
    expect($areas->pluck('id')->toArray())->toContain($this->area1->id, $this->area2->id, $this->area3->id);
    expect($areas->pluck('id')->toArray())->not->toContain($this->inactiveArea->id);
});

test('can get area by id', function () {
    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson("/api/v1/areas/{$this->area1->id}");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $this->area1->id,
                'name' => 'Jakarta Utara',
                'code' => 'JKT-UT',
            ],
        ]);
});

test('returns 404 when area not found', function () {
    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/areas/99999');

    $response->assertStatus(404);
});

test('sales with no assigned areas get empty list', function () {
    // Create sales user without areas
    $userWithoutAreas = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $userWithoutAreas->assignRole('Sales');

    $response = $this->actingAs($userWithoutAreas, 'sanctum')
        ->getJson('/api/v1/areas');

    $response->assertOk();

    $areas = collect($response->json('data'));
    expect($areas)->toBeEmpty();
});

test('area response contains correct structure', function () {
    $response = $this->actingAs($this->adminUser, 'sanctum')
        ->getJson('/api/v1/areas');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'code',
                ],
            ],
        ]);

    $firstArea = $response->json('data.0');
    expect($firstArea)->toHaveKeys(['id', 'name', 'code']);
});

test('cannot access areas without authentication', function () {
    $response = $this->getJson('/api/v1/areas');

    $response->assertStatus(401);
});

test('cannot access area by id without authentication', function () {
    $response = $this->getJson("/api/v1/areas/{$this->area1->id}");

    $response->assertStatus(401);
});
