import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

interface Area {
    id: number;
    name: string;
    code: string;
}

interface CreateUserProps {
    branches: Branch[];
    areas: Area[];
    availableRoles: string[];
}

// Define explicit form type
interface CreateUserForm {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
    branch_id: number;
    roles: string[];
    areas?: number[];
    is_active: boolean;
}

const createUserSchema = z.object({
    name: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().email('Email tidak valid'),
    password: z.string().min(8, 'Password minimal 8 karakter'),
    password_confirmation: z.string(),
    phone: z.string().optional(),
    branch_id: z.coerce.number().min(1, 'Pilih cabang'),
    roles: z.array(z.string()).min(1, 'Pilih minimal 1 role'),
    areas: z.array(z.coerce.number()).optional(),
    is_active: z.boolean().default(true),
}).refine((data) => data.password === data.password_confirmation, {
    message: 'Password tidak sama',
    path: ['password_confirmation'],
});

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'User Management', href: '/admin/users' },
    { title: 'Tambah User', href: '/admin/users/create' },
];

export default function CreateUser({
    branches,
    areas,
    availableRoles,
}: CreateUserProps) {
    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            is_active: true,
            roles: [],
            areas: [],
        },
    });

    const selectedRoles = useWatch({ control, name: 'roles' }) || [];

    const onSubmit = (data: CreateUserForm) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.post('/admin/users', data as any);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah User" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Tambah User Baru</h1>
                        <p className="text-muted-foreground">
                            Buat akun pengguna baru untuk sistem
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/admin/users">
                            <ArrowLeft className="mr-2 size-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Informasi Personal
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="name">
                                            Nama Lengkap *
                                        </Label>
                                        <Input
                                            id="name"
                                            {...register('name')}
                                            placeholder="John Doe"
                                            className="mt-2"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            {...register('email')}
                                            placeholder="john@example.com"
                                            className="mt-2"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="phone">
                                            No. Telepon
                                        </Label>
                                        <Input
                                            id="phone"
                                            {...register('phone')}
                                            placeholder="08123456789"
                                            className="mt-2"
                                        />
                                        {errors.phone && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.phone.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="branch_id">
                                            Cabang *
                                        </Label>
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
                                                        <SelectValue placeholder="Pilih Cabang" />
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
                                                                    {
                                                                        branch.name
                                                                    }
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
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Password
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="password">
                                            Password *
                                        </Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            {...register('password')}
                                            placeholder="Min. 8 karakter"
                                            className="mt-2"
                                        />
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.password.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="password_confirmation">
                                            Konfirmasi Password *
                                        </Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            {...register(
                                                'password_confirmation',
                                            )}
                                            placeholder="Ketik ulang password"
                                            className="mt-2"
                                        />
                                        {errors.password_confirmation && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {
                                                    errors.password_confirmation
                                                        .message
                                                }
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Roles */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Role & Akses *
                                </h2>
                                <div className="space-y-3">
                                    {availableRoles.map((role) => (
                                        <div
                                            key={role}
                                            className="flex items-center gap-2"
                                        >
                                            <Controller
                                                name="roles"
                                                control={control}
                                                render={({ field }) => (
                                                    <Checkbox
                                                        checked={field.value?.includes(
                                                            role,
                                                        )}
                                                        onCheckedChange={(
                                                            checked,
                                                        ) => {
                                                            const newValue =
                                                                checked
                                                                    ? [
                                                                          ...field.value,
                                                                          role,
                                                                      ]
                                                                    : field.value.filter(
                                                                          (
                                                                              r,
                                                                          ) =>
                                                                              r !==
                                                                              role,
                                                                      );
                                                            field.onChange(
                                                                newValue,
                                                            );
                                                        }}
                                                    />
                                                )}
                                            />
                                            <Label className="font-normal">
                                                {role}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                                {errors.roles && (
                                    <p className="mt-2 text-sm text-destructive">
                                        {errors.roles.message}
                                    </p>
                                )}
                            </div>

                            {/* Areas (Only for Sales) */}
                            {selectedRoles.includes('Sales') && (
                                <div>
                                    <h2 className="mb-4 text-lg font-semibold">
                                        Area Penjualan
                                    </h2>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        {areas.map((area) => (
                                            <div
                                                key={area.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Controller
                                                    name="areas"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Checkbox
                                                            checked={field.value?.includes(
                                                                area.id,
                                                            )}
                                                            onCheckedChange={(
                                                                checked,
                                                            ) => {
                                                                const newValue =
                                                                    checked
                                                                        ? [
                                                                              ...(field.value ||
                                                                                  []),
                                                                              area.id,
                                                                          ]
                                                                        : (
                                                                              field.value ||
                                                                              []
                                                                          ).filter(
                                                                              (
                                                                                  id,
                                                                              ) =>
                                                                                  id !==
                                                                                  area.id,
                                                                          );
                                                                field.onChange(
                                                                    newValue,
                                                                );
                                                            }}
                                                        />
                                                    )}
                                                />
                                                <Label className="font-normal">
                                                    {area.name} ({area.code})
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Status Akun
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
                                        Aktifkan akun setelah dibuat
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex justify-end gap-3 border-t pt-6">
                            <Button asChild variant="outline" type="button">
                                <Link href="/admin/users">Batal</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Save className="mr-2 size-4" />
                                {isSubmitting ? 'Menyimpan...' : 'Simpan User'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
