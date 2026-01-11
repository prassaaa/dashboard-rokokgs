<?php

declare(strict_types=1);

use App\Models\Area;
use App\Models\Branch;
use App\Models\User;
use App\Models\Visit;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Create roles
    Role::firstOrCreate(['name' => 'Sales', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Admin Cabang', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);

    // Create branch
    $this->branch = Branch::factory()->create([
        'name' => 'Branch Jakarta',
        'is_active' => true,
    ]);

    // Create another branch
    $this->otherBranch = Branch::factory()->create([
        'name' => 'Branch Surabaya',
        'is_active' => true,
    ]);

    // Create area
    $this->area = Area::create([
        'name' => 'Jakarta Utara',
        'code' => 'JKT-UT',
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);

    // Create sales user
    $this->salesUser = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->salesUser->assignRole('Sales');
    $this->salesUser->areas()->attach([$this->area->id]);

    // Create another sales user in same branch
    $this->otherSalesUser = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->otherSalesUser->assignRole('Sales');

    // Create admin user
    $this->adminUser = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->adminUser->assignRole('Admin Cabang');

    // Create super admin
    $this->superAdmin = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->superAdmin->assignRole('Super Admin');
});

test('sales can create visit with valid data', function () {
    $visitData = [
        'customer_name' => 'Toko Maju Jaya',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Sudirman No. 123',
        'visit_type' => 'routine',
        'purpose' => 'Pengecekan stok toko',
        'result' => 'Toko masih memiliki stok cukup',
        'notes' => 'Akan order minggu depan',
        'latitude' => -6.2088,
        'longitude' => 106.8456,
        'area_id' => $this->area->id,
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/visits', $visitData);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'visit_number',
                'visit_date',
                'customer_name',
                'customer_phone',
                'customer_address',
                'visit_type',
                'visit_type_label',
                'purpose',
                'result',
                'status',
                'notes',
                'latitude',
                'longitude',
                'branch',
                'sales',
                'area',
            ],
        ])
        ->assertJson([
            'success' => true,
            'data' => [
                'customer_name' => 'Toko Maju Jaya',
                'visit_type' => 'routine',
                'status' => 'pending',
            ],
        ]);

    // Verify visit was created
    $this->assertDatabaseHas('visits', [
        'customer_name' => 'Toko Maju Jaya',
        'sales_id' => $this->salesUser->id,
        'branch_id' => $this->branch->id,
    ]);
});

test('sales can create visit with minimal data', function () {
    $visitData = [
        'customer_name' => 'Toko Sederhana',
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/visits', $visitData);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'data' => [
                'customer_name' => 'Toko Sederhana',
                'visit_type' => 'routine', // Default value
                'status' => 'pending',
            ],
        ]);
});

test('cannot create visit without customer name', function () {
    $visitData = [
        'customer_phone' => '081234567890',
        'visit_type' => 'routine',
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/visits', $visitData);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['customer_name']);
});

test('cannot create visit with invalid visit type', function () {
    $visitData = [
        'customer_name' => 'Toko Test',
        'visit_type' => 'invalid_type',
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/visits', $visitData);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['visit_type']);
});

test('can create visit with all valid visit types', function () {
    $validTypes = ['routine', 'prospecting', 'follow_up', 'complaint', 'other'];

    foreach ($validTypes as $type) {
        $response = $this->actingAs($this->salesUser, 'sanctum')
            ->postJson('/api/v1/visits', [
                'customer_name' => "Toko {$type}",
                'visit_type' => $type,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'visit_type' => $type,
                ],
            ]);
    }
});

test('sales can get their own visits', function () {
    // Create visits for this sales user
    Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Customer 1',
        'status' => 'pending',
    ]);

    Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Customer 2',
        'status' => 'approved',
    ]);

    // Create visit for other sales user
    Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->otherSalesUser->id,
        'customer_name' => 'Other Customer',
        'status' => 'pending',
    ]);

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/visits');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'visit_number',
                    'customer_name',
                    'visit_type',
                    'status',
                ],
            ],
            'meta' => [
                'current_page',
                'total',
            ],
        ]);

    // Should only see own visits
    $visits = collect($response->json('data'));
    expect($visits)->toHaveCount(2);
    expect($visits->pluck('customer_name')->toArray())->toContain('Customer 1', 'Customer 2');
    expect($visits->pluck('customer_name')->toArray())->not->toContain('Other Customer');
});

test('admin can see all visits in their branch', function () {
    // Create visits for different sales
    Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Customer 1',
    ]);

    Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->otherSalesUser->id,
        'customer_name' => 'Customer 2',
    ]);

    // Create visit in other branch (should not see)
    $otherBranchSales = User::factory()->create([
        'branch_id' => $this->otherBranch->id,
        'is_active' => true,
    ]);
    $otherBranchSales->assignRole('Sales');

    Visit::factory()->create([
        'branch_id' => $this->otherBranch->id,
        'sales_id' => $otherBranchSales->id,
        'customer_name' => 'Other Branch Customer',
    ]);

    $response = $this->actingAs($this->adminUser, 'sanctum')
        ->getJson('/api/v1/visits');

    $response->assertOk();

    // Should see all visits in their branch
    $visits = collect($response->json('data'));
    expect($visits)->toHaveCount(2);
    expect($visits->pluck('customer_name')->toArray())->toContain('Customer 1', 'Customer 2');
    expect($visits->pluck('customer_name')->toArray())->not->toContain('Other Branch Customer');
});

test('can filter visits by status', function () {
    Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Pending Visit',
        'status' => 'pending',
    ]);

    Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Approved Visit',
        'status' => 'approved',
    ]);

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/visits?status=pending');

    $response->assertOk();

    $visits = collect($response->json('data'));
    expect($visits)->toHaveCount(1);
    expect($visits->first()['customer_name'])->toBe('Pending Visit');
});

test('can filter visits by visit type', function () {
    Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Routine Visit',
        'visit_type' => 'routine',
    ]);

    Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Complaint Visit',
        'visit_type' => 'complaint',
    ]);

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/visits?visit_type=routine');

    $response->assertOk();

    $visits = collect($response->json('data'));
    expect($visits)->toHaveCount(1);
    expect($visits->first()['customer_name'])->toBe('Routine Visit');
});

test('sales can get visit by id if its theirs', function () {
    $visit = Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'My Visit',
        'visit_type' => 'routine',
        'purpose' => 'Check stock',
    ]);

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson("/api/v1/visits/{$visit->id}");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $visit->id,
                'customer_name' => 'My Visit',
                'visit_type' => 'routine',
                'purpose' => 'Check stock',
            ],
        ]);
});

test('sales cannot view other sales visits', function () {
    $visit = Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->otherSalesUser->id,
        'customer_name' => 'Other Visit',
    ]);

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson("/api/v1/visits/{$visit->id}");

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
        ]);
});

test('admin can view any visit in their branch', function () {
    $visit = Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Sales Visit',
    ]);

    $response = $this->actingAs($this->adminUser, 'sanctum')
        ->getJson("/api/v1/visits/{$visit->id}");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $visit->id,
                'customer_name' => 'Sales Visit',
            ],
        ]);
});

test('returns 404 when visit not found', function () {
    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/visits/99999');

    $response->assertStatus(404);
});

test('can get visits by sales id', function () {
    // Create visits for sales user
    Visit::factory()->count(3)->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
    ]);

    // Sales can only see their own
    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson("/api/v1/visits/sales/{$this->salesUser->id}");

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(3);
});

test('sales cannot get other sales visits via bySales endpoint', function () {
    Visit::factory()->count(2)->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->otherSalesUser->id,
    ]);

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson("/api/v1/visits/sales/{$this->otherSalesUser->id}");

    $response->assertStatus(403);
});

test('admin can get visits by any sales id in their branch', function () {
    Visit::factory()->count(2)->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
    ]);

    $response = $this->actingAs($this->adminUser, 'sanctum')
        ->getJson("/api/v1/visits/sales/{$this->salesUser->id}");

    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

test('can get visit statistics', function () {
    // Create visits with different statuses
    Visit::factory()->count(3)->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'status' => 'pending',
        'visit_date' => today(),
    ]);

    Visit::factory()->count(2)->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'status' => 'approved',
        'visit_date' => today(),
    ]);

    Visit::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'status' => 'rejected',
        'visit_date' => today(),
    ]);

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/visits/statistics');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                'total',
                'pending',
                'approved',
                'rejected',
                'today',
                'this_week',
                'this_month',
            ],
        ])
        ->assertJson([
            'success' => true,
            'data' => [
                'total' => 6,
                'pending' => 3,
                'approved' => 2,
                'rejected' => 1,
                'today' => 6,
            ],
        ]);
});

test('cannot create visit without authentication', function () {
    $response = $this->postJson('/api/v1/visits', [
        'customer_name' => 'Test',
    ]);

    $response->assertStatus(401);
});

test('cannot access visits without authentication', function () {
    $response = $this->getJson('/api/v1/visits');

    $response->assertStatus(401);
});

test('visit number is auto generated', function () {
    $visitData = [
        'customer_name' => 'Toko Test',
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/visits', $visitData);

    $response->assertStatus(201);

    $visitNumber = $response->json('data.visit_number');
    expect($visitNumber)->toStartWith('VST-');
    expect($visitNumber)->toMatch('/^VST-\d{8}-\d{4}$/');
});

test('visit type label is returned correctly', function () {
    $visitData = [
        'customer_name' => 'Toko Test',
        'visit_type' => 'follow_up',
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/visits', $visitData);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'data' => [
                'visit_type' => 'follow_up',
                'visit_type_label' => 'Follow Up',
            ],
        ]);
});

test('validates latitude range', function () {
    $visitData = [
        'customer_name' => 'Toko Test',
        'latitude' => 100, // Invalid: must be between -90 and 90
        'longitude' => 106.8456,
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/visits', $visitData);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['latitude']);
});

test('validates longitude range', function () {
    $visitData = [
        'customer_name' => 'Toko Test',
        'latitude' => -6.2088,
        'longitude' => 200, // Invalid: must be between -180 and 180
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/visits', $visitData);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['longitude']);
});

test('visit is created with correct branch from user', function () {
    $visitData = [
        'customer_name' => 'Toko Test',
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/visits', $visitData);

    $response->assertStatus(201);

    $this->assertDatabaseHas('visits', [
        'customer_name' => 'Toko Test',
        'branch_id' => $this->salesUser->branch_id,
        'sales_id' => $this->salesUser->id,
    ]);
});

test('customer name is sanitized', function () {
    $visitData = [
        'customer_name' => '<script>alert("xss")</script>Toko Test',
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/visits', $visitData);

    $response->assertStatus(201)
        ->assertJson([
            'success' => true,
            'data' => [
                'customer_name' => 'alert("xss")Toko Test', // Script tag stripped
            ],
        ]);
});
