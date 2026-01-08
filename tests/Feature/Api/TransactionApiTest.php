<?php

declare(strict_types=1);

use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\SalesTransaction;
use App\Models\Stock;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Create roles
    Role::create(['name' => 'Sales', 'guard_name' => 'web']);
    Role::create(['name' => 'Admin Cabang', 'guard_name' => 'web']);

    // Create branch
    $this->branch = Branch::factory()->create([
        'name' => 'Branch Jakarta',
        'is_active' => true,
    ]);

    // Create category
    $this->category = ProductCategory::create([
        'code' => 'CAT01',
        'name' => 'Test Category',
        'slug' => 'test-category',
        'is_active' => true,
    ]);

    // Create products
    $this->product1 = Product::factory()->create([
        'code' => 'P001',
        'name' => 'Product 1',
        'product_category_id' => $this->category->id,
        'price' => 100000,
        'cost' => 50000,
        'is_active' => true,
    ]);

    $this->product2 = Product::factory()->create([
        'code' => 'P002',
        'name' => 'Product 2',
        'product_category_id' => $this->category->id,
        'price' => 50000,
        'cost' => 25000,
        'is_active' => true,
    ]);

    // Create stock
    Stock::factory()->create([
        'product_id' => $this->product1->id,
        'branch_id' => $this->branch->id,
        'quantity' => 100,
        'minimum_stock' => 10,
    ]);

    Stock::factory()->create([
        'product_id' => $this->product2->id,
        'branch_id' => $this->branch->id,
        'quantity' => 50,
        'minimum_stock' => 5,
    ]);

    // Create sales user
    $this->salesUser = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->salesUser->assignRole('Sales');

    // Create admin user
    $this->adminUser = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->adminUser->assignRole('Admin Cabang');

    // Create another sales user
    $this->otherSalesUser = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->otherSalesUser->assignRole('Sales');
});

test('sales can create transaction with valid data', function () {
    $transactionData = [
        'customer_name' => 'John Doe',
        'customer_phone' => '081234567890',
        'customer_address' => 'Jl. Test No. 123',
        'latitude' => '-6.2088',
        'longitude' => '106.8456',
        'items' => [
            [
                'product_id' => $this->product1->id,
                'quantity' => 2,
                'price' => 100000,
                'subtotal' => 200000,
            ],
            [
                'product_id' => $this->product2->id,
                'quantity' => 1,
                'price' => 50000,
                'subtotal' => 50000,
            ],
        ],
        'subtotal' => 250000,
        'discount' => 10000,
        'total' => 240000,
        'payment_method' => 'cash',
        'notes' => 'Test transaction',
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/transactions', $transactionData);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'transaction_number',
                'customer_name',
                'total',
                'status',
                'items' => [
                    '*' => [
                        'product_id',
                        'quantity',
                        'price',
                        'subtotal',
                    ],
                ],
            ],
        ])
        ->assertJson([
            'success' => true,
            'data' => [
                'customer_name' => 'John Doe',
                'total' => 240000,
            ],
        ]);

    // Verify stock decreased
    expect(Stock::where('product_id', $this->product1->id)->first()->quantity)->toBe(98);
    expect(Stock::where('product_id', $this->product2->id)->first()->quantity)->toBe(49);
});

test('cannot create transaction with insufficient stock', function () {
    $transactionData = [
        'customer_name' => 'John Doe',
        'items' => [
            [
                'product_id' => $this->product1->id,
                'quantity' => 200, // Exceeds available stock (100)
                'price' => 100000,
                'subtotal' => 20000000,
            ],
        ],
        'subtotal' => 20000000,
        'discount' => 0,
        'total' => 20000000,
        'payment_method' => 'cash',
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/transactions', $transactionData);

    $response->assertStatus(422)
        ->assertJson([
            'success' => false,
        ]);
});

test('sales can get their own transactions', function () {
    // Create transaction for this sales user
    SalesTransaction::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Customer 1',
        'total' => 100000,
        'status' => 'approved',
    ]);

    // Create transaction for other sales user
    SalesTransaction::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->otherSalesUser->id,
        'customer_name' => 'Customer 2',
        'total' => 200000,
        'status' => 'approved',
    ]);

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson('/api/v1/transactions');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'transaction_number',
                    'customer_name',
                    'total',
                ],
            ],
            'meta' => [
                'current_page',
                'total',
            ],
        ]);

    // Should only see own transactions
    $transactions = collect($response->json('data'));
    expect($transactions->pluck('customer_name')->toArray())->toContain('Customer 1');
    expect($transactions->pluck('customer_name')->toArray())->not->toContain('Customer 2');
});

test('admin can see all transactions in their branch', function () {
    // Create transactions for different sales
    SalesTransaction::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Customer 1',
        'total' => 100000,
    ]);

    SalesTransaction::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->otherSalesUser->id,
        'customer_name' => 'Customer 2',
        'total' => 200000,
    ]);

    $response = $this->actingAs($this->adminUser, 'sanctum')
        ->getJson('/api/v1/transactions');

    $response->assertOk();

    // Should see all transactions
    $transactions = collect($response->json('data'));
    expect($transactions)->toHaveCount(2);
    expect($transactions->pluck('customer_name')->toArray())->toContain('Customer 1', 'Customer 2');
});

test('sales can get transaction by id if its theirs', function () {
    $transaction = SalesTransaction::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Customer 1',
        'total' => 150000,
    ]);

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson("/api/v1/transactions/{$transaction->id}");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $transaction->id,
                'customer_name' => 'Customer 1',
            ],
        ]);
});

test('sales cannot view other sales transactions', function () {
    $transaction = SalesTransaction::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->otherSalesUser->id,
        'customer_name' => 'Customer 2',
    ]);

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->getJson("/api/v1/transactions/{$transaction->id}");

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'Unauthorized',
        ]);
});

test('admin can view any transaction in their branch', function () {
    $transaction = SalesTransaction::factory()->create([
        'branch_id' => $this->branch->id,
        'sales_id' => $this->salesUser->id,
        'customer_name' => 'Customer 1',
    ]);

    $response = $this->actingAs($this->adminUser, 'sanctum')
        ->getJson("/api/v1/transactions/{$transaction->id}");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $transaction->id,
            ],
        ]);
});

test('cannot create transaction without authentication', function () {
    $response = $this->postJson('/api/v1/transactions', [
        'customer_name' => 'John Doe',
        'items' => [],
        'total' => 100000,
    ]);

    $response->assertStatus(401);
});

test('cannot access transactions without authentication', function () {
    $response = $this->getJson('/api/v1/transactions');

    $response->assertStatus(401);
});

test('transaction requires valid items array', function () {
    $transactionData = [
        'customer_name' => 'John Doe',
        'items' => [], // Empty items
        'subtotal' => 0,
        'total' => 0,
        'payment_method' => 'cash',
    ];

    $response = $this->actingAs($this->salesUser, 'sanctum')
        ->postJson('/api/v1/transactions', $transactionData);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['items']);
});
