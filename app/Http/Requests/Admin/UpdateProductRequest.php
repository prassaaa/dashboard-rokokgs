<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['Super Admin', 'Admin Cabang']);
    }

    public function rules(): array
    {
        $productId = $this->route('product');

        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', Rule::unique('products')->ignore($productId)],
            'product_category_id' => ['required', 'exists:product_categories,id'],
            'barcode' => ['nullable', 'string', 'max:255', Rule::unique('products')->ignore($productId)],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'cost' => ['nullable', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:50'],
            'items_per_carton' => ['nullable', 'integer', 'min:1'],
            'image' => ['nullable', 'image', 'max:2048'],
            'is_active' => ['boolean'],
            'branch_ids' => ['nullable', 'array'],
            'branch_ids.*' => ['exists:branches,id'],
        ];
    }

    public function attributes(): array
    {
        return [
            'product_category_id' => 'category',
        ];
    }
}
