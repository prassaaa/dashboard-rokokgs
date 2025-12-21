<?php

declare(strict_types=1);

use App\Models\Branch;
use App\Models\User;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->branch = Branch::factory()->create();

    // Create roles
    Role::firstOrCreate(['name' => 'Super Admin']);
    Role::firstOrCreate(['name' => 'Admin Cabang']);
    Role::firstOrCreate(['name' => 'Sales']);

    // Create test user
    $this->user = User::factory()->create([
        'branch_id' => $this->branch->id,
        'email' => 'test@example.com',
        'is_active' => true,
    ]);
    $this->user->assignRole('Sales');
});

test('can login with valid credentials', function () {
    $response = $this->postJson('/api/v1/login', [
        'email' => 'test@example.com',
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'user' => ['id', 'name', 'email', 'branch', 'roles'],
                'token',
            ],
        ]);

    expect($response->json('data.token'))->not->toBeNull();
});

test('cannot login with invalid credentials', function () {
    $response = $this->postJson('/api/v1/login', [
        'email' => 'test@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'success' => false,
            'message' => 'Invalid credentials',
        ]);
});

test('cannot login with inactive account', function () {
    $this->user->update(['is_active' => false]);

    $response = $this->postJson('/api/v1/login', [
        'email' => 'test@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'Account is inactive',
        ]);
});

test('can get authenticated user profile', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/api/v1/profile');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'message',
            'data' => ['id', 'name', 'email', 'branch', 'roles'],
        ])
        ->assertJson([
            'data' => [
                'id' => $this->user->id,
                'email' => 'test@example.com',
            ],
        ]);
});

test('cannot access protected route without authentication', function () {
    $response = $this->getJson('/api/v1/profile');

    $response->assertStatus(401);
});

test('can logout successfully', function () {
    $token = $this->user->createToken('test-token')->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/v1/logout');

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Logout successful',
        ]);

    // Token should be revoked
    expect($this->user->tokens()->count())->toBe(0);
});
