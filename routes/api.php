<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::prefix('v1')->group(function () {
    Route::post('login', [\App\Http\Controllers\Api\AuthController::class, 'login'])
        ->middleware('throttle:5,1');
    Route::post('register', [\App\Http\Controllers\Api\AuthController::class, 'register'])
        ->middleware('throttle:3,1');
});

// Protected routes
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('logout', [\App\Http\Controllers\Api\AuthController::class, 'logout']);
    Route::get('profile', [\App\Http\Controllers\Api\AuthController::class, 'profile']);
    Route::put('profile', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);

    // Products
    Route::get('products/category/{categoryId}', [\App\Http\Controllers\Api\ProductController::class, 'byCategory']);
    Route::apiResource('products', \App\Http\Controllers\Api\ProductController::class)->only(['index', 'show']);

    // Stocks
    Route::get('stocks', [\App\Http\Controllers\Api\StockController::class, 'index']);
    Route::get('stocks/product/{productId}', [\App\Http\Controllers\Api\StockController::class, 'byProduct']);
    Route::get('stocks/low-stock', [\App\Http\Controllers\Api\StockController::class, 'lowStock']);

    // Sales Transactions
    Route::get('transactions/sales/{salesId}', [\App\Http\Controllers\Api\TransactionController::class, 'bySales']);
    Route::apiResource('transactions', \App\Http\Controllers\Api\TransactionController::class)->only(['index', 'store', 'show']);

    // Areas
    Route::get('areas', [\App\Http\Controllers\Api\AreaController::class, 'index']);
    Route::get('areas/{id}', [\App\Http\Controllers\Api\AreaController::class, 'show']);
});
