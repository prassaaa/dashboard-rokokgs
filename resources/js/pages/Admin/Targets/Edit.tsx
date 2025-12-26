import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

interface Branch {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    branch_id: number;
}

interface Target {
    id: number;
    branch_id: number;
    user_id: number;
    type: 'revenue' | 'quantity';
    amount: number | null;
    quantity: number | null;
    period_type: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    year: number;
    month: number | null;
    start_date: string | null;
    end_date: string | null;
}

interface EditProps {
    target: Target;
    branches: Branch[];
    salesUsers: User[];
}

const editTargetSchema = z.object({
    branch_id: z.coerce.number().min(1, 'Pilih cabang'),
    user_id: z.coerce.number().min(1, 'Pilih sales'),
    type: z.enum(['revenue', 'quantity'], { message: 'Pilih tipe target' }),
    amount: z.coerce.number().min(0).optional().nullable(),
    quantity: z.coerce.number().int().min(0).optional().nullable(),
    period_type: z.enum(['monthly', 'quarterly', 'yearly', 'custom'], {
        message: 'Pilih tipe periode',
    }),
    year: z.coerce.number().min(2020).max(2100),
    month: z.coerce.number().min(1).max(12).optional().nullable(),
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
});

type EditTargetForm = z.infer<typeof editTargetSchema>;

const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

export default function Edit({ target, branches, salesUsers }: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Manajemen Target', href: '/admin/targets' },
        { title: 'Edit Target', href: `/admin/targets/${target.id}/edit` },
    ];

    const currentYear = new Date().getFullYear();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EditTargetForm>({
        resolver: zodResolver(editTargetSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            branch_id: target.branch_id,
            user_id: target.user_id,
            type: target.type,
            amount: target.amount,
            quantity: target.quantity,
            period_type: target.period_type,
            year: target.year,
            month: target.month,
            start_date: target.start_date,
            end_date: target.end_date,
        },
    });

    const selectedType = useWatch({ control, name: 'type' });
    const selectedPeriodType = useWatch({ control, name: 'period_type' });
    const selectedBranchId = useWatch({ control, name: 'branch_id' });

    const filteredSalesUsers = selectedBranchId
        ? salesUsers.filter((u) => u.branch_id === selectedBranchId)
        : salesUsers;

    const onSubmit = (data: EditTargetForm) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.put(`/admin/targets/${target.id}`, data as any);
    };

    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Target" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Target</h1>
                        <p className="text-muted-foreground">
                            Update target penjualan
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/admin/targets">
                            <ArrowLeft className="mr-2 size-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Sales Selection */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Informasi Sales
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="branch_id">Cabang *</Label>
                                        <Controller
                                            name="branch_id"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value?.toString()}
                                                    onValueChange={(value) =>
                                                        field.onChange(
                                                            parseInt(value),
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="mt-2">
                                                        <SelectValue placeholder="Pilih cabang" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {branches.map(
                                                            (branch) => (
                                                                <SelectItem
                                                                    key={
                                                                        branch.id
                                                                    }
                                                                    value={branch.id.toString()}
                                                                >
                                                                    {branch.name}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.branch_id && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.branch_id.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="user_id">Sales *</Label>
                                        <Controller
                                            name="user_id"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value?.toString()}
                                                    onValueChange={(value) =>
                                                        field.onChange(
                                                            parseInt(value),
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="mt-2">
                                                        <SelectValue placeholder="Pilih sales" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredSalesUsers.map(
                                                            (user) => (
                                                                <SelectItem
                                                                    key={user.id}
                                                                    value={user.id.toString()}
                                                                >
                                                                    {user.name}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.user_id && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.user_id.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Target Information */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Informasi Target
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="type">Tipe Target *</Label>
                                        <Controller
                                            name="type"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="mt-2">
                                                        <SelectValue placeholder="Pilih tipe" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="revenue">
                                                            Omset (Revenue)
                                                        </SelectItem>
                                                        <SelectItem value="quantity">
                                                            Kuantitas (Unit)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.type && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.type.message}
                                            </p>
                                        )}
                                    </div>

                                    {selectedType === 'revenue' && (
                                        <div>
                                            <Label htmlFor="amount">
                                                Target Omset (Rp) *
                                            </Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                {...register('amount')}
                                                placeholder="10000000"
                                                className="mt-2"
                                            />
                                            {errors.amount && (
                                                <p className="mt-1 text-sm text-destructive">
                                                    {errors.amount.message}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {selectedType === 'quantity' && (
                                        <div>
                                            <Label htmlFor="quantity">
                                                Target Kuantitas (Unit) *
                                            </Label>
                                            <Input
                                                id="quantity"
                                                type="number"
                                                {...register('quantity')}
                                                placeholder="100"
                                                className="mt-2"
                                            />
                                            {errors.quantity && (
                                                <p className="mt-1 text-sm text-destructive">
                                                    {errors.quantity.message}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Period Information */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Periode Target
                                </h2>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label htmlFor="period_type">
                                            Tipe Periode *
                                        </Label>
                                        <Controller
                                            name="period_type"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="mt-2">
                                                        <SelectValue placeholder="Pilih periode" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="monthly">
                                                            Bulanan
                                                        </SelectItem>
                                                        <SelectItem value="quarterly">
                                                            Kuartalan
                                                        </SelectItem>
                                                        <SelectItem value="yearly">
                                                            Tahunan
                                                        </SelectItem>
                                                        <SelectItem value="custom">
                                                            Custom
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.period_type && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.period_type.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="year">Tahun *</Label>
                                        <Controller
                                            name="year"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value?.toString()}
                                                    onValueChange={(value) =>
                                                        field.onChange(
                                                            parseInt(value),
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="mt-2">
                                                        <SelectValue placeholder="Pilih tahun" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {years.map((year) => (
                                                            <SelectItem
                                                                key={year}
                                                                value={year.toString()}
                                                            >
                                                                {year}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.year && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.year.message}
                                            </p>
                                        )}
                                    </div>

                                    {selectedPeriodType === 'monthly' && (
                                        <div>
                                            <Label htmlFor="month">Bulan *</Label>
                                            <Controller
                                                name="month"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value?.toString()}
                                                        onValueChange={(value) =>
                                                            field.onChange(
                                                                parseInt(value),
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="mt-2">
                                                            <SelectValue placeholder="Pilih bulan" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {monthNames.map(
                                                                (month, idx) => (
                                                                    <SelectItem
                                                                        key={idx}
                                                                        value={(
                                                                            idx + 1
                                                                        ).toString()}
                                                                    >
                                                                        {month}
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.month && (
                                                <p className="mt-1 text-sm text-destructive">
                                                    {errors.month.message}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {selectedPeriodType === 'custom' && (
                                        <>
                                            <div>
                                                <Label htmlFor="start_date">
                                                    Tanggal Mulai *
                                                </Label>
                                                <Input
                                                    id="start_date"
                                                    type="date"
                                                    {...register('start_date')}
                                                    className="mt-2"
                                                />
                                                {errors.start_date && (
                                                    <p className="mt-1 text-sm text-destructive">
                                                        {errors.start_date.message}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <Label htmlFor="end_date">
                                                    Tanggal Akhir *
                                                </Label>
                                                <Input
                                                    id="end_date"
                                                    type="date"
                                                    {...register('end_date')}
                                                    className="mt-2"
                                                />
                                                {errors.end_date && (
                                                    <p className="mt-1 text-sm text-destructive">
                                                        {errors.end_date.message}
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex justify-end gap-3 border-t pt-6">
                            <Button asChild variant="outline" type="button">
                                <Link href="/admin/targets">Batal</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Save className="mr-2 size-4" />
                                {isSubmitting ? 'Menyimpan...' : 'Update Target'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
