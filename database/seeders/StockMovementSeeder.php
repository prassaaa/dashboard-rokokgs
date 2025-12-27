<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class StockMovementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::where('code', '!=', 'PUSAT')->get();
        $pusat = Branch::where('code', 'PUSAT')->first();
        $products = Product::all();
        $superAdmin = User::role('Super Admin')->first();
        $adminCabangs = User::role('Admin Cabang')->get()->keyBy('branch_id');

        // Create stock movements for the last 60 days
        for ($day = 60; $day >= 0; $day--) {
            $date = Carbon::now()->subDays($day);

            foreach ($branches as $branch) {
                $adminCabang = $adminCabangs->get($branch->id) ?? $superAdmin;

                // 1-3 movements per branch per day
                $movementCount = rand(1, 3);

                for ($i = 0; $i < $movementCount; $i++) {
                    $product = $products->random();
                    $type = $this->getRandomMovementType();

                    $movement = [
                        'reference_number' => 'MOV-' . $date->format('Ymd') . '-' . strtoupper(Str::random(6)),
                        'product_id' => $product->id,
                        'type' => $type,
                        'quantity' => $this->getQuantityByType($type),
                        'notes' => $this->getNotesByType($type),
                        'created_by' => $adminCabang->id,
                        'created_at' => $date->copy()->addHours(rand(8, 17))->addMinutes(rand(0, 59)),
                        'updated_at' => $date->copy()->addHours(rand(8, 17))->addMinutes(rand(0, 59)),
                    ];

                    // Set branch based on movement type
                    switch ($type) {
                        case 'in':
                            $movement['from_branch_id'] = $pusat->id;
                            $movement['to_branch_id'] = $branch->id;
                            $movement['approved_at'] = $date->copy()->addHours(rand(8, 17));
                            $movement['approved_by'] = $superAdmin->id;
                            break;

                        case 'out':
                        case 'sale':
                            $movement['from_branch_id'] = $branch->id;
                            $movement['to_branch_id'] = null;
                            $movement['approved_at'] = $date->copy()->addHours(rand(8, 17));
                            $movement['approved_by'] = $adminCabang->id;
                            break;

                        case 'transfer':
                            $otherBranch = $branches->where('id', '!=', $branch->id)->random();
                            $movement['from_branch_id'] = $branch->id;
                            $movement['to_branch_id'] = $otherBranch->id;
                            $movement['approved_at'] = $date->copy()->addHours(rand(8, 17));
                            $movement['approved_by'] = $superAdmin->id;
                            break;

                        case 'adjustment':
                            $movement['from_branch_id'] = $branch->id;
                            $movement['to_branch_id'] = $branch->id;
                            $movement['approved_at'] = $date->copy()->addHours(rand(8, 17));
                            $movement['approved_by'] = $adminCabang->id;
                            break;

                        case 'return':
                            $movement['from_branch_id'] = null;
                            $movement['to_branch_id'] = $branch->id;
                            $movement['approved_at'] = $date->copy()->addHours(rand(8, 17));
                            $movement['approved_by'] = $adminCabang->id;
                            break;
                    }

                    StockMovement::create($movement);
                }
            }
        }
    }

    private function getRandomMovementType(): string
    {
        $types = ['in', 'in', 'in', 'out', 'adjustment', 'transfer', 'return'];
        return $types[array_rand($types)];
    }

    private function getQuantityByType(string $type): int
    {
        return match ($type) {
            'in' => rand(50, 200),
            'out' => rand(10, 50),
            'sale' => rand(5, 30),
            'transfer' => rand(20, 100),
            'adjustment' => rand(-10, 10),
            'return' => rand(1, 20),
            default => rand(1, 50),
        };
    }

    private function getNotesByType(string $type): ?string
    {
        $notes = match ($type) {
            'in' => ['Pengiriman dari pusat', 'Restok bulanan', 'Pengadaan rutin', null],
            'out' => ['Pengeluaran untuk event', 'Stok rusak', 'Expired', null],
            'sale' => ['Penjualan reguler', null],
            'transfer' => ['Transfer antar cabang', 'Bantu stok cabang lain', null],
            'adjustment' => ['Koreksi stok opname', 'Penyesuaian sistem', 'Selisih fisik'],
            'return' => ['Retur dari customer', 'Barang cacat', null],
            default => [null],
        };

        return $notes[array_rand($notes)];
    }
}
