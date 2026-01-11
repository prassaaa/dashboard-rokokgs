<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class CreateVisitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'area_id' => ['nullable', 'exists:areas,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:20'],
            'customer_address' => ['nullable', 'string', 'max:500'],
            'visit_type' => ['nullable', 'string', 'in:routine,prospecting,follow_up,complaint,other'],
            'purpose' => ['nullable', 'string', 'max:1000'],
            'result' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png,jpg', 'max:5120'], // Max 5MB
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Sanitize input strings
        if ($this->has('customer_name')) {
            $this->merge([
                'customer_name' => strip_tags($this->customer_name),
            ]);
        }

        if ($this->has('customer_address')) {
            $this->merge([
                'customer_address' => strip_tags($this->customer_address),
            ]);
        }

        if ($this->has('purpose')) {
            $this->merge([
                'purpose' => strip_tags($this->purpose),
            ]);
        }

        if ($this->has('result')) {
            $this->merge([
                'result' => strip_tags($this->result),
            ]);
        }

        if ($this->has('notes')) {
            $this->merge([
                'notes' => strip_tags($this->notes),
            ]);
        }
    }

    public function messages(): array
    {
        return [
            'customer_name.required' => 'Nama pelanggan wajib diisi',
            'customer_name.max' => 'Nama pelanggan maksimal 255 karakter',
            'visit_type.in' => 'Tipe kunjungan tidak valid',
            'photo.image' => 'File harus berupa gambar',
            'photo.max' => 'Ukuran foto maksimal 5MB',
        ];
    }
}
