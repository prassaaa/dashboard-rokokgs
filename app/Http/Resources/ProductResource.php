<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'barcode' => $this->barcode,
            'price' => (float) $this->price,
            'cost' => (float) $this->cost,
            'unit' => $this->unit,
            'items_per_carton' => $this->items_per_carton,
            'is_active' => $this->is_active,
            'category' => $this->whenLoaded('productCategory', function () {
                return [
                    'id' => $this->productCategory->id,
                    'name' => $this->productCategory->name,
                    'code' => $this->productCategory->code,
                ];
            }),
            'stock' => $this->when(isset($this->stock_quantity), function () {
                return [
                    'quantity' => (int) $this->stock_quantity,
                    'available' => (int) $this->stock_quantity > 0,
                ];
            }),
        ];
    }
}
