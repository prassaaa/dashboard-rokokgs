<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Area;
use App\Models\User;
use Illuminate\Database\Seeder;

class AreaUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get sales users by branch
        $jakartaSales = User::role('Sales')
            ->whereHas('branch', fn ($q) => $q->where('code', 'JKT-01'))
            ->get();

        $bandungSales = User::role('Sales')
            ->whereHas('branch', fn ($q) => $q->where('code', 'BDG-01'))
            ->get();

        $surabayaSales = User::role('Sales')
            ->whereHas('branch', fn ($q) => $q->where('code', 'SBY-01'))
            ->get();

        // Get areas by branch
        $jakartaAreas = Area::whereHas('branch', fn ($q) => $q->where('code', 'JKT-01'))->get();
        $bandungAreas = Area::whereHas('branch', fn ($q) => $q->where('code', 'BDG-01'))->get();
        $surabayaAreas = Area::whereHas('branch', fn ($q) => $q->where('code', 'SBY-01'))->get();

        // Assign Jakarta sales to Jakarta areas
        foreach ($jakartaSales as $index => $sales) {
            // Each sales gets 1-2 areas
            $areasToAssign = $jakartaAreas->skip($index)->take(rand(1, 2));
            foreach ($areasToAssign as $area) {
                $sales->areas()->syncWithoutDetaching([$area->id]);
            }
        }

        // Assign Bandung sales to Bandung areas
        foreach ($bandungSales as $index => $sales) {
            $areasToAssign = $bandungAreas->skip($index % $bandungAreas->count())->take(rand(1, 2));
            foreach ($areasToAssign as $area) {
                $sales->areas()->syncWithoutDetaching([$area->id]);
            }
        }

        // Assign Surabaya sales to Surabaya areas
        foreach ($surabayaSales as $index => $sales) {
            $areasToAssign = $surabayaAreas->skip($index % $surabayaAreas->count())->take(rand(1, 2));
            foreach ($areasToAssign as $area) {
                $sales->areas()->syncWithoutDetaching([$area->id]);
            }
        }
    }
}
