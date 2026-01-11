<?php

declare(strict_types=1);

namespace App\DataTransferObjects;

final readonly class VisitDTO extends BaseDTO
{
    public function __construct(
        public int $branch_id,
        public int $sales_id,
        public string $customer_name,
        public ?string $customer_phone = null,
        public ?string $customer_address = null,
        public string $visit_type = 'routine',
        public ?string $purpose = null,
        public ?string $result = null,
        public ?string $notes = null,
        public ?float $latitude = null,
        public ?float $longitude = null,
        public ?int $area_id = null,
        public ?string $photo = null,
    ) {
    }

    public function toArray(): array
    {
        return [
            'branch_id' => $this->branch_id,
            'sales_id' => $this->sales_id,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'customer_address' => $this->customer_address,
            'visit_type' => $this->visit_type,
            'purpose' => $this->purpose,
            'result' => $this->result,
            'notes' => $this->notes,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'area_id' => $this->area_id,
            'photo' => $this->photo,
        ];
    }
}
