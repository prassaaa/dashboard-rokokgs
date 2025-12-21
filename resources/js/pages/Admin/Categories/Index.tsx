import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, FolderOpen, Plus, Search, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Category {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    products_count: number;
}

interface PaginatedCategories {
    data: Category[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface IndexProps {
    categories: PaginatedCategories;
    filters: {
        status?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Kategori', href: '/admin/categories' },
];

export default function Index({ categories, filters }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        categoryId: number | null;
        categoryName: string;
    }>({
        open: false,
        categoryId: null,
        categoryName: '',
    });

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/categories',
            { search, status: filters.status },
            { preserveState: true },
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        const newFilters: Record<string, string> = { ...filters };
        if (value === 'all') {
            delete newFilters[key];
        } else {
            newFilters[key] = value;
        }
        router.get('/admin/categories', newFilters, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.categoryId) return;

        router.delete(`/admin/categories/${deleteDialog.categoryId}`, {
            onSuccess: () =>
                setDeleteDialog({
                    open: false,
                    categoryId: null,
                    categoryName: '',
                }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Kategori" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Manajemen Kategori
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola kategori produk
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/categories/create">
                            <Plus className="mr-2 size-4" />
                            Tambah Kategori
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <label className="mb-2 block text-sm font-medium">
                                Cari Kategori
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Nama kategori..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" variant="secondary">
                                    <Search className="size-4" />
                                </Button>
                            </div>
                        </form>

                        {/* Status Filter */}
                        <div className="w-full md:w-48">
                            <label className="mb-2 block text-sm font-medium">
                                Status
                            </label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('status', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Status
                                    </SelectItem>
                                    <SelectItem value="active">
                                        Aktif
                                    </SelectItem>
                                    <SelectItem value="inactive">
                                        Tidak Aktif
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* Categories Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.data.length > 0 ? (
                        categories.data.map((category) => (
                            <Card key={category.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                                            <FolderOpen className="size-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold">
                                                {category.name}
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                {category.description ||
                                                    'Tidak ada deskripsi'}
                                            </p>
                                            <div className="mt-3 flex items-center gap-2">
                                                <Badge variant="secondary">
                                                    {category.products_count}{' '}
                                                    produk
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        category.is_active
                                                            ? 'success'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {category.is_active
                                                        ? 'Aktif'
                                                        : 'Tidak Aktif'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2 border-t pt-4">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        asChild
                                    >
                                        <Link
                                            href={`/admin/categories/${category.id}/edit`}
                                        >
                                            <Edit className="mr-2 size-4" />
                                            Edit
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                            setDeleteDialog({
                                                open: true,
                                                categoryId: category.id,
                                                categoryName: category.name,
                                            })
                                        }
                                        className="text-destructive hover:bg-destructive hover:text-white"
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full">
                            <Card className="p-12 text-center">
                                <FolderOpen className="mx-auto size-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold">
                                    Tidak ada kategori
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Mulai dengan membuat kategori pertama
                                </p>
                                <Button className="mt-4" asChild>
                                    <Link href="/admin/categories/create">
                                        <Plus className="mr-2 size-4" />
                                        Tambah Kategori
                                    </Link>
                                </Button>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {categories.last_page > 1 && (
                    <Card className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {categories.data.length} dari{' '}
                                {categories.total} kategori
                            </p>
                            <div className="flex gap-2">
                                {categories.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        size="sm"
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.get(link.url)
                                        }
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialog.open}
                    onOpenChange={(open) =>
                        setDeleteDialog({ ...deleteDialog, open })
                    }
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Kategori</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus kategori{' '}
                                <strong>{deleteDialog.categoryName}</strong>?
                                Kategori yang memiliki produk tidak dapat
                                dihapus.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setDeleteDialog({
                                        open: false,
                                        categoryId: null,
                                        categoryName: '',
                                    })
                                }
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                            >
                                Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
