<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['Super Admin', 'Admin Cabang']);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'unique:products'],
            'product_category_id' => ['required', 'exists:product_categories,id'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'commission_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'image' => ['nullable', 'image', 'max:2048'], // 2MB max
            'is_active' => ['boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'product_category_id' => 'category',
        ];
    }
}
