<?php

declare(strict_types=1);

use App\Models\Area;
use App\Models\Branch;
use App\Models\Commission;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\SalesTransaction;
use App\Models\Stock;
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

    // Create sales user with assigned area
    $this->salesUser = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->salesUser->assignRole('Sales');
    $this->salesUser->areas()->attach($this->area1->id);

    // Create another sales user
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

    // Create transactions and commissions
    $this->transaction1 = SalesTransaction::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'area_id' => $this->area1->id,
        'total' => 1000000,
        'status' => 'approved',
    ]);

    $this->commission1 = Commission::create([
        'sales_transaction_id' => $this->transaction1->id,
        'sales_id' => $this->salesUser->id,
        'transaction_amount' => 1000000,
        'commission_amount' => 50000,
        'commission_percentage' => 5.0,
        'status' => 'approved',
    ]);

    $this->transaction2 = SalesTransaction::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'area_id' => $this->area1->id,
        'total' => 500000,
        'status' => 'approved',
    ]);

    $this->commission2 = Commission::create([
        'sales_transaction_id' => $this->transaction2->id,
        'sales_id' => $this->salesUser->id,
        'transaction_amount' => 500000,
        'commission_amount' => 25000,
        'commission_percentage' => 5.0,
        'status' => 'pending',
    ]);

    // Commission for other sales user
    $this->otherTransaction = SalesTransaction::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->otherSalesUser->id,
        'total' => 2000000,
        'status' => 'approved',
    ]);

    $this->otherCommission = Commission::create([
        'sales_transaction_id' => $this->otherTransaction->id,
        'sales_id' => $this->otherSalesUser->id,
        'transaction_amount' => 2000000,
        'commission_amount' => 100000,
        'commission_percentage' => 5.0,
        'status' => 'approved',
    ]);
});

test('sales can get their own commissions', function () {
    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/commissions');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'commission_amount',
                    'commission_percentage',
                    'status',
                    'transaction',
                ],
            ],
            'meta' => [
                'current_page',
                'total',
            ],
        ]);

    // Should only see own commissions
    $commissions = collect($response->json('data'));
    expect($commissions)->toHaveCount(2);
    expect($commissions->pluck('id')->toArray())->toContain($this->commission1->id, $this->commission2->id);
    expect($commissions->pluck('id')->toArray())->not->toContain($this->otherCommission->id);
});

test('sales can filter commissions by status', function () {
    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/commissions?status=approved');

    $response->assertOk();

    $commissions = collect($response->json('data'));
    expect($commissions)->toHaveCount(1);
    expect($commissions->first()['status'])->toBe('approved');
    expect($commissions->first()['id'])->toBe($this->commission1->id);
});

test('sales can get commission summary', function () {
    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/commissions/summary');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'total_transactions',
                'total_sales',
                'total_commission',
                'average_transaction',
            ],
        ]);

    // Verify summary data
    $summary = $response->json('data');
    expect($summary['total_transactions'])->toBe(2);
    expect($summary['total_sales'])->toBe(1500000); // Only approved transactions
    expect($summary['total_commission'])->toBe(75000); // Both commissions
});

test('sales can filter commission summary by date range', function () {
    $today = now()->toDateString();

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson("/api/v1/commissions/summary?start_date={$today}&end_date={$today}");

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                'total_transactions',
                'total_sales',
                'total_commission',
            ],
        ]);
});

test('sales cannot see other sales commissions', function () {
    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/commissions');

    $commissions = collect($response->json('data'));

    // Should not contain other sales commission
    expect($commissions->pluck('id')->toArray())->not->toContain($this->otherCommission->id);
});

test('admin cannot access commissions endpoint', function () {
    $response = $this->actingAs($this->adminUser, 'sanctum')
        ->getJson('/api/v1/commissions');

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'Unauthorized',
        ]);
});

test('admin cannot access commission summary', function () {
    $response = $this->actingAs($this->adminUser, 'sanctum')
        ->getJson('/api/v1/commissions/summary');

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'Unauthorized',
        ]);
});

test('cannot access commissions without authentication', function () {
    $response = $this->getJson('/api/v1/commissions');

    $response->assertStatus(401);
});

test('cannot access commission summary without authentication', function () {
    $response = $this->getJson('/api/v1/commissions/summary');

    $response->assertStatus(401);
});
