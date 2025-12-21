import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

// Define explicit form type
interface CreateBranchForm {
    name: string;
    code: string;
    address: string;
    phone?: string;
    email?: string;
    is_active: boolean;
}

const createBranchSchema = z.object({
    name: z.string().min(3, 'Nama cabang minimal 3 karakter'),
    code: z.string().min(2, 'Kode cabang minimal 2 karakter'),
    address: z.string().min(10, 'Alamat minimal 10 karakter'),
    phone: z.string().optional(),
    email: z.string().email('Email tidak valid').optional().or(z.literal('')),
    is_active: z.boolean().default(true),
});

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Branch Management', href: '/admin/branches' },
    { title: 'Tambah Cabang', href: '/admin/branches/create' },
];

export default function Create() {
    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CreateBranchForm>({
        resolver: zodResolver(createBranchSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            is_active: true,
        },
    });

    const onSubmit = (data: CreateBranchForm) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.post('/admin/branches', data as any);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Cabang" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Tambah Cabang Baru</h1>
                        <p className="text-muted-foreground">
                            Buat cabang baru untuk sistem
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/admin/branches">
                            <ArrowLeft className="mr-2 size-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Informasi Dasar
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="name">
                                            Nama Cabang *
                                        </Label>
                                        <Input
                                            id="name"
                                            {...register('name')}
                                            placeholder="Cabang Pusat"
                                            className="mt-2"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="code">
                                            Kode Cabang *
                                        </Label>
                                        <Input
                                            id="code"
                                            {...register('code')}
                                            placeholder="HO"
                                            className="mt-2"
                                        />
                                        {errors.code && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.code.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <Label htmlFor="address">
                                            Alamat Lengkap *
                                        </Label>
                                        <Textarea
                                            id="address"
                                            {...register('address')}
                                            placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                                            className="mt-2"
                                            rows={3}
                                        />
                                        {errors.address && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.address.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Informasi Kontak
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="phone">
                                            No. Telepon
                                        </Label>
                                        <Input
                                            id="phone"
                                            {...register('phone')}
                                            placeholder="021-12345678"
                                            className="mt-2"
                                        />
                                        {errors.phone && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.phone.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            {...register('email')}
                                            placeholder="cabang@example.com"
                                            className="mt-2"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.email.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Status Cabang
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Controller
                                        name="is_active"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                    <Label className="font-normal">
                                        Aktifkan cabang setelah dibuat
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex justify-end gap-3 border-t pt-6">
                            <Button asChild variant="outline" type="button">
                                <Link href="/admin/branches">Batal</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Save className="mr-2 size-4" />
                                {isSubmitting ? 'Menyimpan...' : 'Simpan Cabang'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
