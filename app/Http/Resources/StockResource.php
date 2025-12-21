<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StockResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'quantity' => (int) $this->quantity,
            'minimum_stock' => (int) $this->minimum_stock,
            'low_stock' => $this->quantity <= $this->minimum_stock,
            'product' => $this->whenLoaded('product', function () {
                return new ProductResource($this->product);
            }),
            'branch' => $this->whenLoaded('branch', function () {
                return [
                    'id' => $this->branch->id,
                    'name' => $this->branch->name,
                    'code' => $this->branch->code,
                ];
            }),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
