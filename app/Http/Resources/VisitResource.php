<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VisitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'visit_number' => $this->visit_number,
            'visit_date' => $this->visit_date?->toDateString(),
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'customer_address' => $this->customer_address,
            'visit_type' => $this->visit_type,
            'visit_type_label' => $this->getVisitTypeLabel(),
            'purpose' => $this->purpose,
            'result' => $this->result,
            'status' => $this->status,
            'notes' => $this->notes,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'photo' => $this->photo ? asset('storage/' . $this->photo) : null,
            'branch' => $this->whenLoaded('branch', function () {
                return [
                    'id' => $this->branch->id,
                    'name' => $this->branch->name,
                ];
            }),
            'sales' => $this->whenLoaded('sales', function () {
                return [
                    'id' => $this->sales->id,
                    'name' => $this->sales->name,
                ];
            }),
            'area' => $this->whenLoaded('area', function () {
                return [
                    'id' => $this->area->id,
                    'name' => $this->area->name,
                    'code' => $this->area->code ?? null,
                ];
            }),
            'approver' => $this->whenLoaded('approver', function () {
                return [
                    'id' => $this->approver->id,
                    'name' => $this->approver->name,
                ];
            }),
            'approved_at' => $this->approved_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    /**
     * Get the visit type label.
     */
    private function getVisitTypeLabel(): string
    {
        return match ($this->visit_type) {
            'routine' => 'Rutin',
            'prospecting' => 'Prospecting',
            'follow_up' => 'Follow Up',
            'complaint' => 'Komplain',
            'other' => 'Lainnya',
            default => $this->visit_type ?? 'N/A',
        };
    }
}
