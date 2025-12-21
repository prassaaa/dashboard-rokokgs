<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'transaction_amount' => (float) $this->transaction_amount,
            'commission_percentage' => (float) $this->commission_percentage,
            'commission_amount' => (float) $this->commission_amount,
            'status' => $this->status,
            'paid_at' => $this->paid_at?->toISOString(),
            'transaction' => $this->whenLoaded('salesTransaction', function () {
                return [
                    'id' => $this->salesTransaction->id,
                    'transaction_number' => $this->salesTransaction->transaction_number,
                    'transaction_date' => $this->salesTransaction->transaction_date?->toDateString(),
                    'customer_name' => $this->salesTransaction->customer_name,
                ];
            }),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
