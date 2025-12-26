<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTargetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['Super Admin', 'Admin Cabang']);
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'user_id' => ['required', 'exists:users,id'],
            'type' => ['required', 'string', 'in:revenue,quantity'],
            'amount' => ['required_if:type,revenue', 'nullable', 'numeric', 'min:0'],
            'quantity' => ['required_if:type,quantity', 'nullable', 'integer', 'min:0'],
            'period_type' => ['required', 'string', 'in:monthly,quarterly,yearly,custom'],
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'month' => ['required_if:period_type,monthly', 'nullable', 'integer', 'min:1', 'max:12'],
            'start_date' => ['required_if:period_type,custom', 'nullable', 'date'],
            'end_date' => ['required_if:period_type,custom', 'nullable', 'date', 'after_or_equal:start_date'],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required_if' => 'Jumlah target wajib diisi untuk tipe revenue.',
            'quantity.required_if' => 'Kuantitas target wajib diisi untuk tipe quantity.',
            'month.required_if' => 'Bulan wajib diisi untuk periode bulanan.',
            'start_date.required_if' => 'Tanggal mulai wajib diisi untuk periode custom.',
            'end_date.required_if' => 'Tanggal akhir wajib diisi untuk periode custom.',
        ];
    }
}
