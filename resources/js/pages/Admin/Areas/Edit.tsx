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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

interface Branch {
    id: number;
    name: string;
}

interface Area {
    id: number;
    name: string;
    code: string;
    branch_id: number;
    description: string | null;
    is_active: boolean;
}

interface EditProps {
    area: Area;
    branches: Branch[];
}

interface EditAreaForm {
    name: string;
    code: string;
    branch_id: number;
    description?: string;
    is_active: boolean;
}

const editAreaSchema = z.object({
    name: z.string().min(3, 'Nama area minimal 3 karakter'),
    code: z.string().min(2, 'Kode area minimal 2 karakter'),
    branch_id: z.coerce.number().min(1, 'Pilih cabang'),
    description: z.string().optional(),
    is_active: z.boolean(),
});

export default function Edit({ area, branches }: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Manajemen Area', href: '/admin/areas' },
        { title: 'Edit Area', href: `/admin/areas/${area.id}/edit` },
    ];

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EditAreaForm>({
        resolver: zodResolver(editAreaSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            name: area.name,
            code: area.code,
            branch_id: area.branch_id,
            description: area.description || '',
            is_active: area.is_active,
        },
    });

    const onSubmit = (data: EditAreaForm) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.put(`/admin/areas/${area.id}`, data as any);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${area.name}`} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Area</h1>
                        <p className="text-muted-foreground">
                            Update informasi area {area.name}
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/admin/areas">
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
                                    Informasi Area
                                </h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="name">Nama Area *</Label>
                                        <Input
                                            id="name"
                                            {...register('name')}
                                            placeholder="Jakarta Selatan"
                                            className="mt-2"
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="code">Kode Area *</Label>
                                        <Input
                                            id="code"
                                            {...register('code')}
                                            placeholder="JKT-S"
                                            className="mt-2"
                                        />
                                        {errors.code && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.code.message}
                                            </p>
                                        )}
                                    </div>

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

                                    <div className="md:col-span-2">
                                        <Label htmlFor="description">
                                            Deskripsi
                                        </Label>
                                        <Textarea
                                            id="description"
                                            {...register('description')}
                                            placeholder="Deskripsi area (opsional)"
                                            className="mt-2"
                                            rows={3}
                                        />
                                        {errors.description && (
                                            <p className="mt-1 text-sm text-destructive">
                                                {errors.description.message}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h2 className="mb-4 text-lg font-semibold">
                                    Status Area
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
                                        Area aktif
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex justify-end gap-3 border-t pt-6">
                            <Button asChild variant="outline" type="button">
                                <Link href="/admin/areas">Batal</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Save className="mr-2 size-4" />
                                {isSubmitting ? 'Menyimpan...' : 'Update Area'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
