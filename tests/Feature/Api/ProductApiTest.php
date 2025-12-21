<?php

declare(strict_types=1);

use App\Models\Branch;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Stock;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->branch = Branch::factory()->create();
    $this->category = ProductCategory::factory()->create();

    Role::firstOrCreate(['name' => 'Sales']);

    $this->user = User::factory()->create([
        'branch_id' => $this->branch->id,
        'is_active' => true,
    ]);
    $this->user->assignRole('Sales');

    // Create test products
    $this->products = Product::factory()->count(5)->create([
        'product_category_id' => $this->category->id,
        'is_active' => true,
    ]);
});

test('can get products list', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/products');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => ['id', 'code', 'name', 'price', 'category'],
            ],
            'meta' => ['current_page', 'total', 'per_page'],
        ]);

    expect($response->json('data'))->toHaveCount(5);
});

test('can search products', function () {
    Product::factory()->create([
        'name' => 'Rokok GS Mild',
        'product_category_id' => $this->category->id,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/products?search=GS');

    $response->assertOk();
    expect($response->json('data'))->not->toBeEmpty();
});

test('can get product by id', function () {
    $product = $this->products->first();

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/api/v1/products/{$product->id}");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'data' => [
                'id' => $product->id,
                'code' => $product->code,
                'name' => $product->name,
            ],
        ]);
});

test('can get products by category', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/api/v1/products/category/{$this->category->id}");

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => ['id', 'code', 'name'],
            ],
        ]);
});

test('cannot access products without authentication', function () {
    $response = $this->getJson('/api/v1/products');

    $response->assertStatus(401);
});
