import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toast } from 'sonner';
import { type BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Minus, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface Product {
    id: number;
    name: string;
    code: string;
}

interface Branch {
    id: number;
    name: string;
}

interface Stock {
    id: number;
    product: Product;
    branch: Branch;
    quantity: number;
    minimum_stock: number;
}

interface AdjustProps {
    stock: Stock;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Stok', href: '/admin/stocks' },
    { title: 'Sesuaikan Stok', href: '#' },
];

const adjustSchema = z.object({
    quantity_change: z
        .string()
        .min(1, 'Jumlah perubahan harus diisi')
        .refine((val) => !isNaN(Number(val)) && Number(val) !== 0, {
            message: 'Jumlah perubahan tidak boleh 0',
        }),
    notes: z.string().optional(),
});

type AdjustFormData = z.infer<typeof adjustSchema>;

export default function Adjust({ stock }: AdjustProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<AdjustFormData>({
        resolver: zodResolver(adjustSchema),
        defaultValues: {
            quantity_change: '',
            notes: '',
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const quantityChange = watch('quantity_change');
    const changeValue = quantityChange ? Number(quantityChange) : 0;
    const newQuantity = Math.max(0, stock.quantity + changeValue);
    const isIncrease = changeValue > 0;

    const onSubmit = (data: AdjustFormData) => {
        const formData = new FormData();
        formData.append('quantity_change', data.quantity_change);
        if (data.notes) {
            formData.append('notes', data.notes);
        }

        router.post(`/admin/stocks/${stock.id}/adjust`, formData, {
            onSuccess: () => toast.success('Stok berhasil disesuaikan'),
            onError: (errors) => {
                console.error('Validation errors:', errors);
                toast.error('Gagal menyesuaikan stok');
            },
        });
    };

    const setQuickAdjust = (value: number) => {
        setValue('quantity_change', value.toString(), {
            shouldValidate: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sesuaikan Stok" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div>
                    <Button variant="ghost" size="sm" className="mb-4" asChild>
                        <Link href="/admin/stocks">
                            <ArrowLeft className="mr-2 size-4" />
                            Kembali
                        </Link>
                    </Button>
                    <h1 className="text-3xl font-bold">
                        Sesuaikan Stok
                    </h1>
                    <p className="text-muted-foreground">
                        Tambah atau kurangi jumlah stok produk
                    </p>
                </div>

                {/* Current Stock Info */}
                <Card className="p-6">
                    <h3 className="mb-4 text-lg font-semibold">
                        Informasi Stok Saat Ini
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Produk
                            </p>
                            <p className="mt-1 font-medium">
                                {stock.product.name}
                            </p>
                            <code className="mt-1 inline-block rounded bg-muted px-2 py-1 text-xs">
                                {stock.product.code}
                            </code>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Cabang
                            </p>
                            <p className="mt-1 font-medium">
                                {stock.branch.name}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Stok Saat Ini
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {stock.quantity}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Minimum Stok
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {stock.minimum_stock}
                            </p>
                        </div>
                    </div>

                    {stock.quantity <= stock.minimum_stock && (
                        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            <div>
                                <p className="font-medium text-destructive">
                                    Stok Menipis
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Stok saat ini sudah mencapai atau di bawah
                                    minimum stok yang ditentukan.
                                </p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Adjustment Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Quick Adjust Buttons */}
                            <div>
                                <Label className="mb-3 block">
                                    Penyesuaian Cepat
                                </Label>
                                <div className="grid grid-cols-6 gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setQuickAdjust(-50)}
                                        className="gap-1"
                                    >
                                        <Minus className="h-3 w-3" />
                                        50
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setQuickAdjust(-20)}
                                        className="gap-1"
                                    >
                                        <Minus className="h-3 w-3" />
                                        20
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setQuickAdjust(-10)}
                                        className="gap-1"
                                    >
                                        <Minus className="h-3 w-3" />
                                        10
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setQuickAdjust(10)}
                                        className="gap-1"
                                    >
                                        <Plus className="h-3 w-3" />
                                        10
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setQuickAdjust(20)}
                                        className="gap-1"
                                    >
                                        <Plus className="h-3 w-3" />
                                        20
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setQuickAdjust(50)}
                                        className="gap-1"
                                    >
                                        <Plus className="h-3 w-3" />
                                        50
                                    </Button>
                                </div>
                            </div>

                            {/* Manual Adjust */}
                            <div className="space-y-2">
                                <Label htmlFor="quantity_change">
                                    Jumlah Perubahan *
                                </Label>
                                <Input
                                    id="quantity_change"
                                    type="number"
                                    placeholder="Contoh: 10 untuk tambah, -10 untuk kurang"
                                    {...register('quantity_change')}
                                    className={
                                        errors.quantity_change
                                            ? 'border-destructive'
                                            : ''
                                    }
                                />
                                {errors.quantity_change && (
                                    <p className="text-sm text-destructive">
                                        {errors.quantity_change.message}
                                    </p>
                                )}
                                <p className="text-sm text-muted-foreground">
                                    Gunakan angka positif untuk menambah, negatif
                                    untuk mengurangi
                                </p>
                            </div>

                            {/* Preview */}
                            {changeValue !== 0 && (
                                <div className="rounded-lg border p-4">
                                    <p className="mb-2 text-sm font-medium">
                                        Preview Perubahan:
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">
                                                Stok Lama
                                            </p>
                                            <p className="text-xl font-bold">
                                                {stock.quantity}
                                            </p>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-center gap-2">
                                                {isIncrease ? (
                                                    <Plus className="h-5 w-5 text-green-500" />
                                                ) : (
                                                    <Minus className="h-5 w-5 text-red-500" />
                                                )}
                                                <span
                                                    className={
                                                        isIncrease
                                                            ? 'font-bold text-green-500'
                                                            : 'font-bold text-red-500'
                                                    }
                                                >
                                                    {Math.abs(changeValue)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">
                                                Stok Baru
                                            </p>
                                            <p
                                                className={`text-xl font-bold ${
                                                    newQuantity <=
                                                    stock.minimum_stock
                                                        ? 'text-destructive'
                                                        : ''
                                                }`}
                                            >
                                                {newQuantity}
                                            </p>
                                        </div>
                                    </div>
                                    {newQuantity <= stock.minimum_stock && (
                                        <p className="mt-2 text-sm text-destructive">
                                            ⚠️ Stok baru akan berada di bawah
                                            minimum stok
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Catatan</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Contoh: Stok rusak, retur customer, dll."
                                    rows={3}
                                    {...register('notes')}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Opsional: Alasan penyesuaian stok
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-6 flex items-center justify-end gap-4 border-t pt-6">
                            <Link href="/admin/stocks">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Menyimpan...'
                                    : 'Simpan Penyesuaian'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
