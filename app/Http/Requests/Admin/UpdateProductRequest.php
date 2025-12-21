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
            'sku' => ['required', 'string', 'max:100', Rule::unique('products')->ignore($productId)],
            'product_category_id' => ['required', 'exists:product_categories,id'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'commission_percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'image' => ['nullable', 'image', 'max:2048'],
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
