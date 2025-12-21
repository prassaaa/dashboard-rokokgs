<?php

declare(strict_types=1);

use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Stock;
use App\Models\User;

beforeEach(function () {
    // Create branch
    $this->branch = Branch::factory()->create([
        'name' => 'Branch Jakarta',
        'is_active' => true,
    ]);

    // Create another branch for isolation testing
    $this->otherBranch = Branch::factory()->create([
        'name' => 'Branch Bandung',
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
        'is_active' => true,
        'price' => 100000,
    ]);

    $this->product2 = Product::factory()->create([
        'code' => 'P002',
        'name' => 'Product 2',
        'product_category_id' => $this->category->id,
        'is_active' => true,
        'price' => 50000,
    ]);

    // Create stock for user's branch
    $this->stock1 = Stock::factory()->create([
        'product_id' => $this->product1->id,
        'branch_id' => $this->branch->id,
        'quantity' => 50,
        'minimum_stock' => 10,
    ]);

    $this->stock2 = Stock::factory()->create([
        'product_id' => $this->product2->id,
        'branch_id' => $this->branch->id,
        'quantity' => 5, // Low stock
        'minimum_stock' => 10,
    ]);

    // Create stock for other branch (should not be accessible)
    $this->otherStock = Stock::factory()->create([
        'product_id' => $this->product1->id,
        'branch_id' => $this->otherBranch->id,
        'quantity' => 100,
        'minimum_stock' => 20,
    ]);

    // Create authenticated user (Sales)
    $this->user = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
});

test('can get stock list for current branch', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/stock');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'quantity',
                    'minimum_stock',
                    'low_stock',
                    'product' => [
                        'id',
                        'code',
                        'name',
                        'price',
                    ],
                    'branch' => [
                        'id',
                        'name',
                    ],
                ],
            ],
        ])
        ->assertJson([
            'success' => true,
        ]);

    // Should have 2 stock items (for current branch only)
    expect($response->json('data'))->toHaveCount(2);

    // Verify it contains stock from user's branch
    $stockIds = collect($response->json('data'))->pluck('id')->toArray();
    expect($stockIds)->toContain($this->stock1->id, $this->stock2->id);
    expect($stockIds)->not->toContain($this->otherStock->id);
});

test('can get stock by product id', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/api/v1/stock/product/{$this->product1->id}");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $this->stock1->id,
                'quantity' => 50,
                'minimum_stock' => 10,
                'low_stock' => false,
                'product' => [
                    'id' => $this->product1->id,
                    'code' => 'P001',
                    'name' => 'Product 1',
                ],
                'branch' => [
                    'id' => $this->branch->id,
                    'name' => 'Branch Jakarta',
                ],
            ],
        ]);
});

test('returns 404 when stock not found for product', function () {
    // Create product without stock
    $productWithoutStock = Product::factory()->create([
        'code' => 'P999',
        'name' => 'Product Without Stock',
        'product_category_id' => $this->category->id,
        'is_active' => true,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/api/v1/stock/product/{$productWithoutStock->id}");

    $response->assertStatus(404)
        ->assertJson([
            'success' => false,
            'message' => 'Stock not found',
        ]);
});

test('can get low stock alerts', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/stock/low-stock');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Low stock alerts retrieved successfully',
        ]);

    // Should only return stock2 (quantity 5 < min_stock 10)
    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['id'])->toBe($this->stock2->id);
    expect($data[0]['low_stock'])->toBe(true);
    expect($data[0]['quantity'])->toBe(5);
    expect($data[0]['minimum_stock'])->toBe(10);
});

test('low stock indicator is correct', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/stock');

    $stocks = collect($response->json('data'));

    // Stock1 (qty=50, min=10) should NOT be low stock
    $stock1Data = $stocks->firstWhere('id', $this->stock1->id);
    expect($stock1Data['low_stock'])->toBe(false);

    // Stock2 (qty=5, min=10) should BE low stock
    $stock2Data = $stocks->firstWhere('id', $this->stock2->id);
    expect($stock2Data['low_stock'])->toBe(true);
});

test('users can only see stock from their own branch', function () {
    // User from branch 1
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/stock');

    $stockIds = collect($response->json('data'))->pluck('id')->toArray();

    // Should not see stock from other branch
    expect($stockIds)->not->toContain($this->otherStock->id);

    // Should only see stocks from own branch
    expect($stockIds)->toContain($this->stock1->id);
    expect($stockIds)->toContain($this->stock2->id);
});

test('cannot access stock without authentication', function () {
    $response = $this->getJson('/api/v1/stock');

    $response->assertStatus(401);
});

test('cannot access stock by product without authentication', function () {
    $response = $this->getJson("/api/v1/stock/product/{$this->product1->id}");

    $response->assertStatus(401);
});

test('cannot access low stock alerts without authentication', function () {
    $response = $this->getJson('/api/v1/stock/low-stock');

    $response->assertStatus(401);
});
