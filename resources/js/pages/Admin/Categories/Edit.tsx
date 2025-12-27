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

interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
}

interface EditProps {
    category: Category;
}

interface EditCategoryForm {
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
}

const editCategorySchema = z.object({
    name: z.string().min(3, 'Nama kategori minimal 3 karakter'),
    slug: z.string().min(3, 'Slug minimal 3 karakter').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
    description: z.string().optional(),
    is_active: z.boolean(),
});

export default function Edit({ category }: EditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Manajemen Kategori', href: '/admin/categories' },
        { title: 'Edit Kategori', href: `/admin/categories/${category.id}/edit` },
    ];

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<EditCategoryForm>({
        resolver: zodResolver(editCategorySchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            is_active: category.is_active,
        },
    });

    const onSubmit = (data: EditCategoryForm) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.put(`/admin/categories/${category.id}`, data as any, {
            onSuccess: () => toast.success('Kategori berhasil diperbarui'),
            onError: () => toast.error('Gagal memperbarui kategori'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${category.name}`} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Kategori</h1>
                        <p className="text-muted-foreground">
                            Update informasi kategori {category.name}
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link href="/admin/categories">
                            <ArrowLeft className="mr-2 size-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card className="p-6">
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="name">Nama Kategori *</Label>
                                <Input
                                    id="name"
                                    {...register('name')}
                                    placeholder="Rokok Filter"
                                    className="mt-2"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="slug">Slug *</Label>
                                <Input
                                    id="slug"
                                    {...register('slug')}
                                    placeholder="rokok-filter"
                                    className="mt-2"
                                />
                                {errors.slug && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.slug.message}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-muted-foreground">
                                    URL-friendly identifier (huruf kecil, angka, strip)
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="description">Deskripsi</Label>
                                <Textarea
                                    id="description"
                                    {...register('description')}
                                    placeholder="Deskripsi kategori..."
                                    className="mt-2"
                                    rows={4}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.description.message}
                                    </p>
                                )}
                            </div>

                            <div>
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
                                        Kategori aktif
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex justify-end gap-3 border-t pt-6">
                            <Button asChild variant="outline" type="button">
                                <Link href="/admin/categories">Batal</Link>
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <Save className="mr-2 size-4" />
                                {isSubmitting
                                    ? 'Menyimpan...'
                                    : 'Update Kategori'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
