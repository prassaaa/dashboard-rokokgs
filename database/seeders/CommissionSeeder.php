<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Commission;
use App\Models\SalesTransaction;
use Illuminate\Database\Seeder;

class CommissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get approved transactions
        $transactions = SalesTransaction::where('status', 'approved')
            ->with('sales')
            ->get();

        $statuses = ['pending', 'pending', 'approved', 'approved', 'paid'];

        foreach ($transactions as $transaction) {
            // Commission rate: 2% of total
            $commissionPercentage = 2.00;
            $commissionAmount = round($transaction->total * ($commissionPercentage / 100));

            $status = $statuses[array_rand($statuses)];

            Commission::create([
                'sales_transaction_id' => $transaction->id,
                'sales_id' => $transaction->sales_id,
                'transaction_amount' => $transaction->total,
                'commission_percentage' => $commissionPercentage,
                'commission_amount' => $commissionAmount,
                'status' => $status,
                'paid_at' => $status === 'paid' ? $transaction->created_at->addDays(rand(7, 14)) : null,
                'notes' => null,
                'created_at' => $transaction->created_at,
                'updated_at' => $transaction->created_at,
            ]);
        }
    }
}
