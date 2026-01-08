<?php

declare(strict_types=1);

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     title="Dashboard Rokokgs API",
 *     version="1.0.0",
 *     description="RESTful API untuk Sistem Management Penjualan Rokok Gas - Dashboard Web dan Mobile App",
 *     @OA\Contact(
 *         email="admin@rokokgs.com"
 *     )
 * )
 *
 * @OA\Server(
 *     url="http://localhost:8000",
 *     description="Local Development Server"
 * )
 *
 * @OA\Server(
 *     url="https://api.rokokgs.com",
 *     description="Production Server"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="sanctum",
 *     type="http",
 *     scheme="bearer",
 *     bearerFormat="Token",
 *     description="Laravel Sanctum Bearer Token Authentication"
 * )
 *
 * @OA\Tag(
 *     name="Authentication",
 *     description="API Endpoints untuk autentikasi user (Login, Register, Logout)"
 * )
 *
 * @OA\Tag(
 *     name="Products",
 *     description="API Endpoints untuk management dan viewing produk"
 * )
 *
 * @OA\Tag(
 *     name="Stock",
 *     description="API Endpoints untuk monitoring dan management stock"
 * )
 *
 * @OA\Tag(
 *     name="Transactions",
 *     description="API Endpoints untuk sales transactions"
 * )
 *
 * @OA\Tag(
 *     name="Areas",
 *     description="API Endpoints untuk area management"
 * )
 */
abstract class Controller
{
    //
}
