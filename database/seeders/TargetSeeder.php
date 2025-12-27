<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Target;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class TargetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all sales users
        $salesUsers = User::role('Sales')->with('branch')->get();

        $currentYear = (int) date('Y');
        $currentMonth = (int) date('m');

        foreach ($salesUsers as $sales) {
            // Create targets for last 3 months + current month
            for ($monthOffset = 3; $monthOffset >= 0; $monthOffset--) {
                $targetDate = Carbon::now()->subMonths($monthOffset);
                $year = (int) $targetDate->format('Y');
                $month = (int) $targetDate->format('m');
                $startDate = Carbon::create($year, $month, 1);
                $endDate = $startDate->copy()->endOfMonth();

                // Create monthly revenue target
                Target::create([
                    'branch_id' => $sales->branch_id,
                    'user_id' => $sales->id,
                    'type' => 'revenue',
                    'amount' => rand(10, 50) * 1000000, // 10-50 juta
                    'quantity' => null,
                    'period_type' => 'monthly',
                    'year' => $year,
                    'month' => $month,
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                ]);

                // Create monthly quantity target
                Target::create([
                    'branch_id' => $sales->branch_id,
                    'user_id' => $sales->id,
                    'type' => 'quantity',
                    'amount' => null,
                    'quantity' => rand(100, 500), // 100-500 unit
                    'period_type' => 'monthly',
                    'year' => $year,
                    'month' => $month,
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                ]);
            }

            // Create yearly revenue target
            Target::create([
                'branch_id' => $sales->branch_id,
                'user_id' => $sales->id,
                'type' => 'revenue',
                'amount' => rand(100, 500) * 1000000, // 100-500 juta
                'quantity' => null,
                'period_type' => 'yearly',
                'year' => $currentYear,
                'month' => null,
                'start_date' => Carbon::create($currentYear, 1, 1)->format('Y-m-d'),
                'end_date' => Carbon::create($currentYear, 12, 31)->format('Y-m-d'),
            ]);
        }
    }
}
