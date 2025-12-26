<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Area;
use App\Models\Branch;
use Illuminate\Database\Seeder;

class AreaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jakarta = Branch::where('code', 'JKT-01')->first();
        $bandung = Branch::where('code', 'BDG-01')->first();
        $surabaya = Branch::where('code', 'SBY-01')->first();

        $areas = [
            // Jakarta Areas
            [
                'branch_id' => $jakarta->id,
                'code' => 'JKT-TIMUR-01',
                'name' => 'Jakarta Timur - Cakung',
                'description' => 'Area Cakung dan sekitarnya',
                'is_active' => true,
            ],
            [
                'branch_id' => $jakarta->id,
                'code' => 'JKT-TIMUR-02',
                'name' => 'Jakarta Timur - Matraman',
                'description' => 'Area Matraman dan sekitarnya',
                'is_active' => true,
            ],
            [
                'branch_id' => $jakarta->id,
                'code' => 'JKT-TIMUR-03',
                'name' => 'Jakarta Timur - Jatinegara',
                'description' => 'Area Jatinegara dan sekitarnya',
                'is_active' => true,
            ],

            // Bandung Areas
            [
                'branch_id' => $bandung->id,
                'code' => 'BDG-PUSAT-01',
                'name' => 'Bandung Pusat - Asia Afrika',
                'description' => 'Area Asia Afrika dan sekitarnya',
                'is_active' => true,
            ],
            [
                'branch_id' => $bandung->id,
                'code' => 'BDG-UTARA-01',
                'name' => 'Bandung Utara - Dago',
                'description' => 'Area Dago dan sekitarnya',
                'is_active' => true,
            ],

            // Surabaya Areas
            [
                'branch_id' => $surabaya->id,
                'code' => 'SBY-PUSAT-01',
                'name' => 'Surabaya Pusat - Tunjungan',
                'description' => 'Area Tunjungan dan sekitarnya',
                'is_active' => true,
            ],
            [
                'branch_id' => $surabaya->id,
                'code' => 'SBY-TIMUR-01',
                'name' => 'Surabaya Timur - Mulyosari',
                'description' => 'Area Mulyosari dan sekitarnya',
                'is_active' => true,
            ],
            [
                'branch_id' => $surabaya->id,
                'code' => 'SBY-SELATAN-01',
                'name' => 'Surabaya Selatan - Gayungan',
                'description' => 'Area Gayungan dan sekitarnya',
                'is_active' => true,
            ],
        ];

        foreach ($areas as $area) {
            Area::create($area);
        }
    }
}
