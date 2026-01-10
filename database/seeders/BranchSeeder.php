<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = [
            [
                'code' => 'PUSAT',
                'name' => 'Kantor Pusat',
                'address' => 'Jl. Raya Industri No. 123',
                'city' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'phone' => '021-12345678',
                'email' => 'pusat@gunungsarialami.com',
                'is_active' => true,
            ],
            [
                'code' => 'JKT-01',
                'name' => 'Cabang Jakarta Timur',
                'address' => 'Jl. Matraman Raya No. 45',
                'city' => 'Jakarta Timur',
                'province' => 'DKI Jakarta',
                'phone' => '021-87654321',
                'email' => 'jakarta-timur@gunungsarialami.com',
                'is_active' => true,
            ],
            [
                'code' => 'BDG-01',
                'name' => 'Cabang Bandung',
                'address' => 'Jl. Asia Afrika No. 100',
                'city' => 'Bandung',
                'province' => 'Jawa Barat',
                'phone' => '022-12345678',
                'email' => 'bandung@gunungsarialami.com',
                'is_active' => true,
            ],
            [
                'code' => 'SBY-01',
                'name' => 'Cabang Surabaya',
                'address' => 'Jl. Basuki Rahmat No. 200',
                'city' => 'Surabaya',
                'province' => 'Jawa Timur',
                'phone' => '031-12345678',
                'email' => 'surabaya@gunungsarialami.com',
                'is_active' => true,
            ],
            [
                'code' => 'SMG-01',
                'name' => 'Cabang Semarang',
                'address' => 'Jl. Pandanaran No. 50',
                'city' => 'Semarang',
                'province' => 'Jawa Tengah',
                'phone' => '024-12345678',
                'email' => 'semarang@gunungsarialami.com',
                'is_active' => true,
            ],
        ];

        foreach ($branches as $branch) {
            Branch::create($branch);
        }
    }
}
