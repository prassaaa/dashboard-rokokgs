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
import { ArrowLeft } from 'lucide-react';
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

interface InitializeProps {
    products: Product[];
    branches: Branch[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Stok', href: '/admin/stocks' },
    { title: 'Inisialisasi Stok', href: '/admin/stocks/initialize' },
];

const stockSchema = z.object({
    product_id: z.string().min(1, 'Pilih produk'),
    branch_id: z.string().min(1, 'Pilih cabang'),
    quantity: z
        .string()
        .min(1, 'Jumlah stok harus diisi')
        .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
            message: 'Jumlah stok harus 0 atau lebih',
        }),
    min_stock: z
        .string()
        .min(1, 'Minimum stok harus diisi')
        .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
            message: 'Minimum stok harus 0 atau lebih',
        }),
});

type StockFormData = z.infer<typeof stockSchema>;

export default function Initialize({ products, branches }: InitializeProps) {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<StockFormData>({
        resolver: zodResolver(stockSchema),
        defaultValues: {
            product_id: '',
            branch_id: '',
            quantity: '',
            min_stock: '',
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedProductId = watch('product_id');
    const selectedBranchId = watch('branch_id');

    const onSubmit = (data: StockFormData) => {
        const formData = new FormData();
        formData.append('product_id', data.product_id);
        formData.append('branch_id', data.branch_id);
        formData.append('quantity', data.quantity);
        formData.append('min_stock', data.min_stock);

        router.post('/admin/stocks/initialize', formData, {
            onError: (errors) => {
                console.error('Validation errors:', errors);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inisialisasi Stok" />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header */}
                <div>
                    <Link href="/admin/stocks">
                        <Button variant="ghost" size="sm" className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Inisialisasi Stok
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Atur stok awal produk untuk cabang tertentu
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Informasi Produk & Cabang */}
                            <div>
                                <h3 className="mb-4 text-lg font-semibold">
                                    Informasi Produk & Cabang
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="product_id">
                                            Produk *
                                        </Label>
                                        <Select
                                            value={selectedProductId}
                                            onValueChange={(value) =>
                                                setValue('product_id', value, {
                                                    shouldValidate: true,
                                                })
                                            }
                                        >
                                            <SelectTrigger
                                                className={
                                                    errors.product_id
                                                        ? 'border-destructive'
                                                        : ''
                                                }
                                            >
                                                <SelectValue placeholder="Pilih produk" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map((product) => (
                                                    <SelectItem
                                                        key={product.id}
                                                        value={product.id.toString()}
                                                    >
                                                        {product.name} (
                                                        {product.code})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.product_id && (
                                            <p className="text-sm text-destructive">
                                                {errors.product_id.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="branch_id">
                                            Cabang *
                                        </Label>
                                        <Select
                                            value={selectedBranchId}
                                            onValueChange={(value) =>
                                                setValue('branch_id', value, {
                                                    shouldValidate: true,
                                                })
                                            }
                                        >
                                            <SelectTrigger
                                                className={
                                                    errors.branch_id
                                                        ? 'border-destructive'
                                                        : ''
                                                }
                                            >
                                                <SelectValue placeholder="Pilih cabang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map((branch) => (
                                                    <SelectItem
                                                        key={branch.id}
                                                        value={branch.id.toString()}
                                                    >
                                                        {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.branch_id && (
                                            <p className="text-sm text-destructive">
                                                {errors.branch_id.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Informasi Stok */}
                            <div>
                                <h3 className="mb-4 text-lg font-semibold">
                                    Informasi Stok
                                </h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity">
                                            Jumlah Stok Awal *
                                        </Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min="0"
                                            placeholder="Contoh: 100"
                                            {...register('quantity')}
                                            className={
                                                errors.quantity
                                                    ? 'border-destructive'
                                                    : ''
                                            }
                                        />
                                        {errors.quantity && (
                                            <p className="text-sm text-destructive">
                                                {errors.quantity.message}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            Jumlah stok awal yang tersedia
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="min_stock">
                                            Minimum Stok *
                                        </Label>
                                        <Input
                                            id="min_stock"
                                            type="number"
                                            min="0"
                                            placeholder="Contoh: 20"
                                            {...register('min_stock')}
                                            className={
                                                errors.min_stock
                                                    ? 'border-destructive'
                                                    : ''
                                            }
                                        />
                                        {errors.min_stock && (
                                            <p className="text-sm text-destructive">
                                                {errors.min_stock.message}
                                            </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            Batas minimum stok untuk alert
                                        </p>
                                    </div>
                                </div>
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
                                    : 'Inisialisasi Stok'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
