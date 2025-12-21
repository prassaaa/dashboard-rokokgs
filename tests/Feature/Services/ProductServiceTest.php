<?php

declare(strict_types=1);

use App\DataTransferObjects\ProductDTO;
use App\Exceptions\DuplicateException;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Services\ProductService;

beforeEach(function () {
    $this->service = new ProductService();
    $this->category = ProductCategory::factory()->create();
});

test('can get paginated products', function () {
    Product::factory()->count(20)->create();

    $result = $this->service->getPaginated(15);

    expect($result->total())->toBe(20)
        ->and($result->perPage())->toBe(15);
});

test('can get all products', function () {
    Product::factory()->count(5)->create();

    $products = $this->service->getAll();

    expect($products)->toHaveCount(5);
});

test('can get product by id', function () {
    $product = Product::factory()->create(['name' => 'Test Product']);

    $result = $this->service->getById($product->id);

    expect($result->name)->toBe('Test Product');
});

test('can create new product', function () {
    $dto = new ProductDTO(
        product_category_id: $this->category->id,
        code: 'PRD-001',
        name: 'Test Product',
        price: 25000,
        barcode: '1234567890',
        cost: 20000,
        unit: 'bungkus',
        items_per_carton: 10,
        is_active: true
    );

    $product = $this->service->create($dto);

    expect($product)
        ->code->toBe('PRD-001')
        ->name->toBe('Test Product')
        ->price->toBe('25000.00')
        ->is_active->toBeTrue();

    $this->assertDatabaseHas('products', [
        'code' => 'PRD-001',
        'name' => 'Test Product',
    ]);
});

test('cannot create product with duplicate code', function () {
    Product::factory()->create(['code' => 'DUP-001']);

    $dto = new ProductDTO(
        product_category_id: $this->category->id,
        code: 'DUP-001',
        name: 'Duplicate Product',
        price: 25000,
        barcode: '1234567890',
        cost: 20000,
        unit: 'bungkus',
        items_per_carton: 10,
        is_active: true
    );

    $this->service->create($dto);
})->throws(DuplicateException::class);

test('can search products', function () {
    Product::factory()->create(['name' => 'Rokok GS Mild']);
    Product::factory()->create(['name' => 'Rokok GS Menthol']);
    Product::factory()->create(['name' => 'Other Brand']);

    $results = $this->service->search('GS');

    expect($results)->toHaveCount(2);
});

test('can update product', function () {
    $product = Product::factory()->create(['name' => 'Old Name', 'price' => 20000]);

    $dto = new ProductDTO(
        product_category_id: $product->product_category_id,
        code: $product->code,
        name: 'New Name',
        price: 30000,
        barcode: $product->barcode,
        cost: (float) $product->cost,
        unit: $product->unit,
        items_per_carton: $product->items_per_carton,
        is_active: $product->is_active
    );

    $updated = $this->service->update($product->id, $dto);

    expect($updated)
        ->name->toBe('New Name')
        ->price->toBe('30000.00');
});

test('can delete product', function () {
    $product = Product::factory()->create();

    $this->service->delete($product->id);

    $this->assertSoftDeleted('products', [
        'id' => $product->id,
    ]);
});

test('can toggle product status', function () {
    $product = Product::factory()->create(['is_active' => true]);

    $result = $this->service->toggleStatus($product->id);

    expect($result->is_active)->toBeFalse();
});

test('can get products by category', function () {
    $category1 = ProductCategory::factory()->create();
    $category2 = ProductCategory::factory()->create();

    Product::factory()->count(3)->create(['product_category_id' => $category1->id]);
    Product::factory()->count(2)->create(['product_category_id' => $category2->id]);

    $results = $this->service->getByCategory($category1->id);

    expect($results)->toHaveCount(3);
});
