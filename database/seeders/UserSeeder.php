<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get branches
        $pusat = Branch::where('code', 'PUSAT')->first();
        $jakarta = Branch::where('code', 'JKT-01')->first();
        $bandung = Branch::where('code', 'BDG-01')->first();
        $surabaya = Branch::where('code', 'SBY-01')->first();

        // Create Super Admin
        $superAdmin = User::create([
            'branch_id' => $pusat->id,
            'name' => 'Super Admin',
            'email' => 'admin@rokokgs.com',
            'phone' => '081234567890',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $superAdmin->assignRole('Super Admin');

        // Create Admin Cabang Jakarta
        $adminJakarta = User::create([
            'branch_id' => $jakarta->id,
            'name' => 'Admin Jakarta',
            'email' => 'admin.jakarta@rokokgs.com',
            'phone' => '081234567891',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $adminJakarta->assignRole('Admin Cabang');

        // Create Admin Cabang Bandung
        $adminBandung = User::create([
            'branch_id' => $bandung->id,
            'name' => 'Admin Bandung',
            'email' => 'admin.bandung@rokokgs.com',
            'phone' => '081234567892',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $adminBandung->assignRole('Admin Cabang');

        // Create Admin Cabang Surabaya
        $adminSurabaya = User::create([
            'branch_id' => $surabaya->id,
            'name' => 'Admin Surabaya',
            'email' => 'admin.surabaya@rokokgs.com',
            'phone' => '081234567893',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $adminSurabaya->assignRole('Admin Cabang');

        // Create Sales for Jakarta
        $sales1 = User::create([
            'branch_id' => $jakarta->id,
            'name' => 'Budi Santoso',
            'email' => 'budi.sales@rokokgs.com',
            'phone' => '081234567894',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $sales1->assignRole('Sales');

        $sales2 = User::create([
            'branch_id' => $jakarta->id,
            'name' => 'Andi Wijaya',
            'email' => 'andi.sales@rokokgs.com',
            'phone' => '081234567895',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $sales2->assignRole('Sales');

        // Create Sales for Bandung
        $sales3 = User::create([
            'branch_id' => $bandung->id,
            'name' => 'Dedi Firmansyah',
            'email' => 'dedi.sales@rokokgs.com',
            'phone' => '081234567896',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $sales3->assignRole('Sales');

        $sales4 = User::create([
            'branch_id' => $bandung->id,
            'name' => 'Eka Pratama',
            'email' => 'eka.sales@rokokgs.com',
            'phone' => '081234567897',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $sales4->assignRole('Sales');

        // Create Sales for Surabaya
        $sales5 = User::create([
            'branch_id' => $surabaya->id,
            'name' => 'Fajar Nugroho',
            'email' => 'fajar.sales@rokokgs.com',
            'phone' => '081234567898',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $sales5->assignRole('Sales');

        $sales6 = User::create([
            'branch_id' => $surabaya->id,
            'name' => 'Gita Permata',
            'email' => 'gita.sales@rokokgs.com',
            'phone' => '081234567899',
            'password' => Hash::make('password'),
            'is_active' => true,
        ]);
        $sales6->assignRole('Sales');
    }
}
