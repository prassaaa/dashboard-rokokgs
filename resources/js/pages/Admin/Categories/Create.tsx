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
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { z } from 'zod';

interface Branch {
    id: number;
    name: string;
}

interface Props {
    branches: Branch[];
}

interface CreateCategoryForm {
    name: string;
    slug: string;
    description?: string;
    is_active: boolean;
    branch_ids?: number[];
}

const createCategorySchema = z.object({
    name: z.string().min(3, 'Nama kategori minimal 3 karakter'),
    slug: z.string().min(3, 'Slug minimal 3 karakter').regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
    description: z.string().optional(),
    is_active: z.boolean().default(true),
    branch_ids: z.array(z.number()).optional(),
});

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Kategori', href: '/admin/categories' },
    { title: 'Tambah Kategori', href: '/admin/categories/create' },
];

export default function Create({ branches }: Props) {
    const { auth } = usePage<{ auth: { user: { roles: string[] } } }>().props;
    const isSuperAdmin = auth?.user?.roles?.includes('Super Admin');
    const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
    const [applyToAllBranches, setApplyToAllBranches] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CreateCategoryForm>({
        resolver: zodResolver(createCategorySchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        defaultValues: {
            is_active: true,
        },
    });

    const onSubmit = (data: CreateCategoryForm) => {
        const submitData = {
            ...data,
            branch_ids: isSuperAdmin 
                ? (applyToAllBranches ? branches.map(b => b.id) : selectedBranches)
                : undefined,
        };

        router.post('/admin/categories', submitData, {
            onSuccess: () => toast.success('Kategori berhasil ditambahkan'),
            onError: () => toast.error('Gagal menambahkan kategori'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Kategori" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Tambah Kategori Baru
                        </h1>
                        <p className="text-muted-foreground">
                            Buat kategori produk baru
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

                            {/* Branch Selection - Super Admin Only */}
                            {isSuperAdmin && (
                                <div>
                                    <h2 className="mb-4 text-lg font-semibold">
                                        Cabang
                                    </h2>

                                    <div className="space-y-4">
                                        {/* Apply to all branches checkbox */}
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="apply_all_branches"
                                                checked={applyToAllBranches}
                                                onCheckedChange={(checked) => {
                                                    setApplyToAllBranches(!!checked);
                                                    if (checked) {
                                                        setSelectedBranches([]);
                                                    }
                                                }}
                                            />
                                            <Label htmlFor="apply_all_branches" className="cursor-pointer">
                                                Terapkan ke semua cabang
                                            </Label>
                                        </div>

                                        {/* Branch selection checkboxes */}
                                        {!applyToAllBranches && (
                                            <div className="space-y-2 border rounded-lg p-4">
                                                <p className="text-sm font-medium mb-2">
                                                    Pilih cabang (kosongkan jika tidak ada):
                                                </p>
                                                {branches.map((branch) => (
                                                    <div key={branch.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`branch-${branch.id}`}
                                                            checked={selectedBranches.includes(branch.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedBranches([...selectedBranches, branch.id]);
                                                                } else {
                                                                    setSelectedBranches(
                                                                        selectedBranches.filter((id) => id !== branch.id)
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <Label htmlFor={`branch-${branch.id}`} className="cursor-pointer">
                                                            {branch.name}
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

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
                                        Aktifkan kategori
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
                                    : 'Simpan Kategori'}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
