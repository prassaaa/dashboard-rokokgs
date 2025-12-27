import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { toast } from 'sonner';
import { type BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

interface Branch {
    id: number;
    name: string;
    code: string;
    address: string | null;
    city: string | null;
    province: string | null;
    phone: string | null;
    email: string | null;
    is_active: boolean;
}

interface EditProps {
    branch: Branch;
}

// Define explicit form type
interface EditBranchForm {
    name: string;
    code: string;
    address?: string;
    city?: string;
    province?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
}

const editBranchSchema = z.object({
    name: z.string().min(3, 'Nama cabang minimal 3 karakter'),
    code: z.string().min(2, 'Kode cabang minimal 2 karakter'),
    address: z.string().max(500, 'Alamat maksimal 500 karakter').optional().or(z.literal('')),
    city: z.string().max(100, 'Nama kota maksimal 100 karakter').optional().or(z.literal('')),
    province: z.string().max(100, 'Nama provinsi maksimal 100 karakter').optional().or(z.literal('')),
    phone: z.string().optional(),
    email: z.string().email('Email tidak valid').optional().or(z.literal('')),
    is_active: z.boolean(),
});

export default function Edit({ branch }: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Manajemen Cabang', href: '/admin/branches' },
        { title: 'Edit Cabang', href: `/admin/branches/${branch.id}/edit` },
    ];

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EditBranchForm>({
        resolver: zodResolver(editBranchSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            name: branch.name,
            code: branch.code,
            address: branch.address || '',
            city: branch.city || '',
            province: branch.province || '',
            phone: branch.phone || '',
            email: branch.email || '',
            is_active: branch.is_active,
        },
    });

    const onSubmit = (data: EditBranchForm) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.put(`/admin/branches/${branch.id}`, data as any, {
            onSuccess: () => toast.success('Cabang berhasil diperbarui'),
            onError: () => toast.error('Gagal memperbarui cabang'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${branch.name}`} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Cabang</h1>
                        <p className="text-muted-foreground">
                            Update informasi cabang {branch.name}
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
                                            Alamat Lengkap
                                        </Label>
                                        <Textarea
                                            id="address"
                                            {...register('address')}
                                            placeholder="Jl. Contoh No. 123"
                                            className="mt-2"
                                            rows={3}
                                        />
                                        {errors.address && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.address.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="city">Kota</Label>
                                        <Input
                                            id="city"
                                            {...register('city')}
                                            placeholder="Jakarta Selatan"
                                            className="mt-2"
                                        />
                                        {errors.city && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.city.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="province">Provinsi</Label>
                                        <Input
                                            id="province"
                                            {...register('province')}
                                            placeholder="DKI Jakarta"
                                            className="mt-2"
                                        />
                                        {errors.province && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.province.message}
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
                                        Cabang aktif
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
                                {isSubmitting ? 'Menyimpan...' : 'Update Cabang'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
