<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // Dashboard
            'view-dashboard',

            // Branch Management
            'view-branches',
            'create-branches',
            'edit-branches',
            'delete-branches',

            // User Management
            'view-users',
            'create-users',
            'edit-users',
            'delete-users',

            // Product Management
            'view-products',
            'create-products',
            'edit-products',
            'delete-products',

            // Stock Management
            'view-stocks',
            'create-stocks',
            'edit-stocks',
            'stock-opname',
            'transfer-stocks',
            'request-stocks',

            // Area Management
            'view-areas',
            'create-areas',
            'edit-areas',
            'delete-areas',
            'assign-sales-area',

            // Sales Transaction Management
            'view-sales-transactions',
            'create-sales-transactions',
            'approve-sales-transactions',
            'delete-sales-transactions',

            // Target Management
            'view-targets',
            'create-targets',
            'edit-targets',
            'delete-targets',

            // Reports
            'view-reports',
            'export-reports',

            // Settings
            'manage-settings',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Super Admin - Full access
        $superAdmin = Role::create(['name' => 'Super Admin']);
        $superAdmin->givePermissionTo(Permission::all());

        // Admin Cabang - Branch level access
        $adminCabang = Role::create(['name' => 'Admin Cabang']);
        $adminCabang->givePermissionTo([
            'view-dashboard',

            // Limited user management (only sales in their branch)
            'view-users',
            'create-users',
            'edit-users',

            // Product view only
            'view-products',

            // Full stock management for their branch
            'view-stocks',
            'create-stocks',
            'edit-stocks',
            'stock-opname',
            'request-stocks',

            // Area management for their branch
            'view-areas',
            'create-areas',
            'edit-areas',
            'assign-sales-area',

            // Sales transaction management
            'view-sales-transactions',
            'approve-sales-transactions',

            // Target management for their sales
            'view-targets',
            'create-targets',
            'edit-targets',

            // Reports for their branch
            'view-reports',
            'export-reports',
        ]);

        // Sales - Field sales access (mobile app)
        $sales = Role::create(['name' => 'Sales']);
        $sales->givePermissionTo([
            'view-dashboard',

            // View products and stock
            'view-products',
            'view-stocks',

            // Create sales transactions
            'view-sales-transactions',
            'create-sales-transactions',

            // View their own targets
            'view-targets',

            // View basic reports
            'view-reports',
        ]);
    }
}
