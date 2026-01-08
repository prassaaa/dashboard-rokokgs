<?php

declare(strict_types=1);

use App\DataTransferObjects\SalesTransactionDTO;
use App\Exceptions\BusinessException;
use App\Exceptions\InsufficientStockException;
use App\Models\Branch;
use App\Models\Product;
use App\Models\SalesTransaction;
use App\Models\Stock;
use App\Models\User;
use App\Services\SalesTransactionService;
use App\Services\StockService;

beforeEach(function () {
    $this->stockService = new StockService();
    $this->service = new SalesTransactionService($this->stockService);

    $this->branch = Branch::factory()->create();
    $this->sales = User::factory()->create(['branch_id' => $this->branch->id]);
    $this->product = Product::factory()->create(['price' => 25000]);

    // Create initial stock
    Stock::factory()->create([
        'branch_id' => $this->branch->id,
        'product_id' => $this->product->id,
        'quantity' => 100,
    ]);

    $this->actingAs($this->sales);
});

test('can get paginated transactions', function () {
    SalesTransaction::factory()->count(20)->create();

    $result = $this->service->getPaginated(15);

    expect($result->total())->toBe(20)
        ->and($result->perPage())->toBe(15);
});

test('can filter transactions by branch', function () {
    $branch1 = Branch::factory()->create();
    $branch2 = Branch::factory()->create();

    SalesTransaction::factory()->count(3)->create(['branch_id' => $branch1->id]);
    SalesTransaction::factory()->count(2)->create(['branch_id' => $branch2->id]);

    $result = $this->service->getPaginated(branchId: $branch1->id);

    expect($result->total())->toBe(3);
});

test('can create sales transaction', function () {
    $dto = new SalesTransactionDTO(
        branch_id: $this->branch->id,
        sales_id: $this->sales->id,
        customer_name: 'Test Customer',
        customer_phone: '081234567890',
        customer_address: 'Test Address',
        latitude: '-6.200000',
        longitude: '106.816666',
        items: [
            [
                'product_id' => $this->product->id,
                'quantity' => 10,
                'price' => 25000,
                'discount' => 0,
            ],
        ],
        subtotal: 250000,
        discount: 0,
        total: 250000,
        payment_method: 'cash',
        notes: null
    );

    $transaction = $this->service->create($dto);

    expect($transaction)
        ->customer_name->toBe('Test Customer')
        ->total->toBe('250000.00')
        ->status->toBe('pending');

    expect($transaction->items)->toHaveCount(1);

    // Verify stock was reduced
    $stock = Stock::where('product_id', $this->product->id)
        ->where('branch_id', $this->branch->id)
        ->first();

    expect($stock->quantity)->toBe(90);
});

test('transaction generates unique transaction number', function () {
    $dto = new SalesTransactionDTO(
        branch_id: $this->branch->id,
        sales_id: $this->sales->id,
        customer_name: 'Test Customer',
        customer_phone: '081234567890',
        customer_address: 'Test Address',
        latitude: '-6.200000',
        longitude: '106.816666',
        items: [
            [
                'product_id' => $this->product->id,
                'quantity' => 5,
                'price' => 25000,
                'discount' => 0,
            ],
        ],
        subtotal: 125000,
        discount: 0,
        total: 125000,
        payment_method: 'cash',
        notes: null
    );

    $transaction1 = $this->service->create($dto);
    $transaction2 = $this->service->create($dto);

    expect($transaction1->transaction_number)
        ->not->toBe($transaction2->transaction_number)
        ->and($transaction1->transaction_number)
        ->toStartWith('TRX-');
});

test('cannot create transaction with insufficient stock', function () {
    $dto = new SalesTransactionDTO(
        transaction_number: 'TRX-TEST-003',
        branch_id: $this->branch->id,
        sales_id: $this->sales->id,
        customer_name: 'Test Customer',
        customer_phone: '081234567890',
        customer_address: 'Test Address',
        latitude: '-6.200000',
        longitude: '106.816666',
        items: [
            [
                'product_id' => $this->product->id,
                'quantity' => 200, // More than available (100)
                'price' => 25000,
                'discount' => 0,
            ],
        ],
        subtotal: 5000000,
        discount: 0,
        total: 5000000,
        payment_method: 'cash',
        notes: null
    );

    $this->service->create($dto);
})->throws(InsufficientStockException::class);

test('can approve transaction', function () {
    $transaction = SalesTransaction::factory()->create([
        'status' => 'pending',
        'total' => 250000,
    ]);

    $approved = $this->service->approve($transaction->id);

    expect($approved)
        ->status->toBe('approved')
        ->approved_at->not->toBeNull();
});

test('cannot approve already approved transaction', function () {
    $transaction = SalesTransaction::factory()->create(['status' => 'approved']);

    $this->service->approve($transaction->id);
})->throws(BusinessException::class);

test('can cancel transaction and restore stock', function () {
    // Create transaction first
    $dto = new SalesTransactionDTO(
        transaction_number: 'TRX-TEST-004',
        branch_id: $this->branch->id,
        sales_id: $this->sales->id,
        customer_name: 'Test Customer',
        customer_phone: '081234567890',
        customer_address: 'Test Address',
        latitude: '-6.200000',
        longitude: '106.816666',
        items: [
            [
                'product_id' => $this->product->id,
                'quantity' => 10,
                'price' => 25000,
                'discount' => 0,
            ],
        ],
        subtotal: 250000,
        discount: 0,
        total: 250000,
        payment_method: 'cash',
        notes: null
    );

    $transaction = $this->service->create($dto);

    // Stock should be 90 after transaction
    $stock = Stock::where('product_id', $this->product->id)
        ->where('branch_id', $this->branch->id)
        ->first();
    expect($stock->quantity)->toBe(90);

    // Cancel transaction
    $cancelled = $this->service->cancel($transaction->id, 'Customer request');

    expect($cancelled->status)->toBe('cancelled');

    // Stock should be restored to 100
    $stock->refresh();
    expect($stock->quantity)->toBe(100);
});

test('cannot cancel approved transaction', function () {
    $transaction = SalesTransaction::factory()->create(['status' => 'approved']);

    $this->service->cancel($transaction->id);
})->throws(BusinessException::class);

test('can get transactions by sales', function () {
    $sales = User::factory()->create();

    SalesTransaction::factory()->count(3)->create(['sales_id' => $sales->id]);
    SalesTransaction::factory()->count(2)->create(); // Other sales

    $transactions = $this->service->getBySales($sales->id);

    expect($transactions)->toHaveCount(3);
});

test('can get sales summary', function () {
    $sales = User::factory()->create();

    SalesTransaction::factory()->create([
        'sales_id' => $sales->id,
        'total' => 100000,
        'status' => 'approved',
    ]);

    SalesTransaction::factory()->create([
        'sales_id' => $sales->id,
        'total' => 150000,
        'status' => 'approved',
    ]);

    $summary = $this->service->getSalesSummary($sales->id);

    expect($summary)
        ->total_transactions->toBe(2)
        ->total_sales->toBe(250000.0)
        ->average_transaction->toBe(125000.0);
});
