<?php

use App\Http\Controllers\Admin\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        // Redirect to admin dashboard for all authenticated users
        return redirect()->route('admin.dashboard');
    })->name('dashboard');
});

// Admin Routes
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // User Management
    Route::resource('users', \App\Http\Controllers\Admin\UserController::class);
    Route::post('users/{user}/approve', [\App\Http\Controllers\Admin\UserController::class, 'approve'])->name('users.approve');
    Route::post('users/{user}/assign-areas', [\App\Http\Controllers\Admin\UserController::class, 'assignAreas'])->name('users.assign-areas');

    // Branch Management (Super Admin Only)
    Route::resource('branches', \App\Http\Controllers\Admin\BranchController::class);

    // Area Management
    Route::resource('areas', \App\Http\Controllers\Admin\AreaController::class);

    // Category & Product Management
    Route::resource('categories', \App\Http\Controllers\Admin\CategoryController::class);
    Route::resource('products', \App\Http\Controllers\Admin\ProductController::class);

    // Stock Management
    Route::get('stocks', [\App\Http\Controllers\Admin\StockController::class, 'index'])->name('stocks.index');
    Route::get('stocks/initialize', [\App\Http\Controllers\Admin\StockController::class, 'initialize'])->name('stocks.initialize');
    Route::post('stocks/initialize', [\App\Http\Controllers\Admin\StockController::class, 'storeInitial'])->name('stocks.store-initial');
    Route::get('stocks/{stock}/adjust', [\App\Http\Controllers\Admin\StockController::class, 'adjust'])->name('stocks.adjust');
    Route::post('stocks/{stock}/adjust', [\App\Http\Controllers\Admin\StockController::class, 'processAdjustment'])->name('stocks.process-adjustment');
    Route::get('stocks/{stock}/movements', [\App\Http\Controllers\Admin\StockController::class, 'movements'])->name('stocks.movements');

    // Target Management
    Route::resource('targets', \App\Http\Controllers\Admin\TargetController::class);

    // Transaction Management
    Route::get('transactions', [\App\Http\Controllers\Admin\TransactionController::class, 'index'])->name('transactions.index');
    Route::get('transactions/locations', [\App\Http\Controllers\Admin\TransactionController::class, 'locations'])->name('transactions.locations');
    Route::get('transactions/{transaction}', [\App\Http\Controllers\Admin\TransactionController::class, 'show'])->name('transactions.show');
    Route::post('transactions/{transaction}/approve', [\App\Http\Controllers\Admin\TransactionController::class, 'approve'])->name('transactions.approve');
    Route::post('transactions/{transaction}/reject', [\App\Http\Controllers\Admin\TransactionController::class, 'reject'])->name('transactions.reject');

    // Reports & Analytics
    Route::get('reports/sales', [\App\Http\Controllers\Admin\ReportController::class, 'sales'])->name('reports.sales');
    Route::get('reports/products', [\App\Http\Controllers\Admin\ReportController::class, 'products'])->name('reports.products');
    Route::get('reports/sales-performance', [\App\Http\Controllers\Admin\ReportController::class, 'salesPerformance'])->name('reports.sales-performance');
});

require __DIR__.'/settings.php';
