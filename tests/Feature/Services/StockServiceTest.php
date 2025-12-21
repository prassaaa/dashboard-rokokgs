<?php

declare(strict_types=1);

use App\Exceptions\InsufficientStockException;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\StockService;

beforeEach(function () {
    $this->service = new StockService();
    $this->branch = Branch::factory()->create();
    $this->product = Product::factory()->create();
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

test('can get stock by branch', function () {
    Stock::factory()->create([
        'branch_id' => $this->branch->id,
        'product_id' => $this->product->id,
        'quantity' => 100,
    ]);

    $stocks = $this->service->getByBranch($this->branch->id);

    expect($stocks)->toHaveCount(1)
        ->and($stocks->first()->quantity)->toBe(100);
});

test('can get stock by product', function () {
    $branch1 = Branch::factory()->create();
    $branch2 = Branch::factory()->create();

    Stock::factory()->create([
        'branch_id' => $branch1->id,
        'product_id' => $this->product->id,
        'quantity' => 100,
    ]);

    Stock::factory()->create([
        'branch_id' => $branch2->id,
        'product_id' => $this->product->id,
        'quantity' => 50,
    ]);

    $stocks = $this->service->getByProduct($this->product->id);

    expect($stocks)->toHaveCount(2);
});

test('can add stock', function () {
    $stock = $this->service->addStock(
        productId: $this->product->id,
        branchId: $this->branch->id,
        quantity: 100,
        type: 'in',
        notes: 'Initial stock'
    );

    expect($stock->quantity)->toBe(100);

    $this->assertDatabaseHas('stocks', [
        'product_id' => $this->product->id,
        'branch_id' => $this->branch->id,
        'quantity' => 100,
    ]);

    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $this->product->id,
        'to_branch_id' => $this->branch->id,
        'type' => 'in',
        'quantity' => 100,
    ]);
});

test('can reduce stock', function () {
    Stock::factory()->create([
        'branch_id' => $this->branch->id,
        'product_id' => $this->product->id,
        'quantity' => 100,
    ]);

    $stock = $this->service->reduceStock(
        productId: $this->product->id,
        branchId: $this->branch->id,
        quantity: 30,
        type: 'out'
    );

    expect($stock->quantity)->toBe(70);

    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $this->product->id,
        'from_branch_id' => $this->branch->id,
        'type' => 'out',
        'quantity' => 30,
    ]);
});

test('cannot reduce stock below zero', function () {
    Stock::factory()->create([
        'branch_id' => $this->branch->id,
        'product_id' => $this->product->id,
        'quantity' => 10,
    ]);

    $this->service->reduceStock(
        productId: $this->product->id,
        branchId: $this->branch->id,
        quantity: 20
    );
})->throws(InsufficientStockException::class);

test('can transfer stock between branches', function () {
    $fromBranch = Branch::factory()->create();
    $toBranch = Branch::factory()->create();

    Stock::factory()->create([
        'branch_id' => $fromBranch->id,
        'product_id' => $this->product->id,
        'quantity' => 100,
    ]);

    $result = $this->service->transferStock(
        productId: $this->product->id,
        fromBranchId: $fromBranch->id,
        toBranchId: $toBranch->id,
        quantity: 30,
        notes: 'Transfer test'
    );

    expect($result['from_stock']->quantity)->toBe(70)
        ->and($result['to_stock']->quantity)->toBe(30);

    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $this->product->id,
        'from_branch_id' => $fromBranch->id,
        'to_branch_id' => $toBranch->id,
        'type' => 'transfer',
        'quantity' => 30,
    ]);
});

test('cannot transfer more stock than available', function () {
    $fromBranch = Branch::factory()->create();
    $toBranch = Branch::factory()->create();

    Stock::factory()->create([
        'branch_id' => $fromBranch->id,
        'product_id' => $this->product->id,
        'quantity' => 10,
    ]);

    $this->service->transferStock(
        productId: $this->product->id,
        fromBranchId: $fromBranch->id,
        toBranchId: $toBranch->id,
        quantity: 20
    );
})->throws(InsufficientStockException::class);

test('can get low stock alerts', function () {
    Stock::factory()->create([
        'branch_id' => $this->branch->id,
        'quantity' => 5,
        'minimum_stock' => 10,
    ]);

    Stock::factory()->create([
        'branch_id' => $this->branch->id,
        'quantity' => 50,
        'minimum_stock' => 10,
    ]);

    $alerts = $this->service->getLowStockAlerts();

    expect($alerts)->toHaveCount(1);
});

test('can perform stock opname', function () {
    $product1 = Product::factory()->create();
    $product2 = Product::factory()->create();

    Stock::factory()->create([
        'branch_id' => $this->branch->id,
        'product_id' => $product1->id,
        'quantity' => 100,
    ]);

    Stock::factory()->create([
        'branch_id' => $this->branch->id,
        'product_id' => $product2->id,
        'quantity' => 50,
    ]);

    $stockData = [
        ['product_id' => $product1->id, 'physical_quantity' => 95],
        ['product_id' => $product2->id, 'physical_quantity' => 55],
    ];

    $adjustments = $this->service->stockOpname($this->branch->id, $stockData);

    expect($adjustments)->toHaveCount(2);

    $this->assertDatabaseHas('stocks', [
        'product_id' => $product1->id,
        'quantity' => 95,
    ]);

    $this->assertDatabaseHas('stocks', [
        'product_id' => $product2->id,
        'quantity' => 55,
    ]);

    expect(StockMovement::where('type', 'adjustment')->count())->toBe(2);
});

test('stock opname does not create adjustment if no difference', function () {
    Stock::factory()->create([
        'branch_id' => $this->branch->id,
        'product_id' => $this->product->id,
        'quantity' => 100,
    ]);

    $stockData = [
        ['product_id' => $this->product->id, 'physical_quantity' => 100],
    ];

    $adjustments = $this->service->stockOpname($this->branch->id, $stockData);

    expect($adjustments)->toHaveCount(0);
    expect(StockMovement::where('type', 'adjustment')->count())->toBe(0);
});
