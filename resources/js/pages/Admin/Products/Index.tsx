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
import { Edit, Package, Plus, Search, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';

interface Product {
    id: number;
    code: string;
    name: string;
    product_category: {
        id: number;
        name: string;
    };
    unit: string;
    cost: number;
    price: number;
    items_per_carton: number;
    image: string | null;
    is_active: boolean;
}

interface Category {
    id: number;
    name: string;
}

interface PaginatedProducts {
    data: Product[];
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
    products: PaginatedProducts;
    categories: Category[];
    filters: {
        category_id?: string;
        status?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Product Management', href: '/admin/products' },
];

export default function Index({ products, categories, filters }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        productId: number | null;
        productName: string;
    }>({
        open: false,
        productId: null,
        productName: '',
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/products',
            {
                search,
                category_id: filters.category_id,
                status: filters.status,
            },
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
        router.get('/admin/products', newFilters, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteDialog.productId) return;

        router.delete(`/admin/products/${deleteDialog.productId}`, {
            onSuccess: () =>
                setDeleteDialog({
                    open: false,
                    productId: null,
                    productName: '',
                }),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Management" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Product Management
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola produk dan stok
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/admin/products/create">
                            <Plus className="mr-2 size-4" />
                            Tambah Produk
                        </Link>
                    </Button>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <label className="mb-2 block text-sm font-medium">
                                Cari Produk
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Nama atau Kode produk..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" variant="secondary">
                                    <Search className="size-4" />
                                </Button>
                            </div>
                        </form>

                        {/* Category Filter */}
                        <div className="w-full md:w-48">
                            <label className="mb-2 block text-sm font-medium">
                                Kategori
                            </label>
                            <Select
                                value={filters.category_id || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('category_id', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Kategori
                                    </SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id.toString()}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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

                {/* Products Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-muted/50">
                                <tr>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Produk
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Kategori
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Harga Beli
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Harga Jual
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Unit
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Item/Karton
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Status
                                    </th>
                                    <th className="p-4 text-left text-sm font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {products.data.length > 0 ? (
                                    products.data.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                                                        {product.image ? (
                                                            <img
                                                                src={`/storage/${product.image}`}
                                                                alt={product.name}
                                                                className="size-12 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <Package className="size-6 text-primary" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {product.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {product.code}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="secondary">
                                                    {product.product_category.name}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm">
                                                    {formatPrice(product.cost)}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium">
                                                    {formatPrice(product.price)}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm">
                                                    {product.unit}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="secondary">
                                                    {product.items_per_carton}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant={
                                                        product.is_active
                                                            ? 'success'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {product.is_active
                                                        ? 'Aktif'
                                                        : 'Tidak Aktif'}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/admin/products/${product.id}/edit`}
                                                        >
                                                            <Edit className="size-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setDeleteDialog({
                                                                open: true,
                                                                productId:
                                                                    product.id,
                                                                productName:
                                                                    product.name,
                                                            })
                                                        }
                                                        className="text-destructive hover:bg-destructive hover:text-white"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="p-8 text-center text-muted-foreground"
                                        >
                                            Tidak ada data produk
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {products.last_page > 1 && (
                        <div className="flex items-center justify-between border-t p-4">
                            <p className="text-sm text-muted-foreground">
                                Menampilkan {products.data.length} dari{' '}
                                {products.total} produk
                            </p>
                            <div className="flex gap-2">
                                {products.links.map((link, index) => (
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
                    )}
                </Card>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialog.open}
                    onOpenChange={(open) =>
                        setDeleteDialog({ ...deleteDialog, open })
                    }
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Hapus Produk</DialogTitle>
                            <DialogDescription>
                                Apakah Anda yakin ingin menghapus produk{' '}
                                <strong>{deleteDialog.productName}</strong>?
                                Aksi ini tidak dapat dibatalkan.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setDeleteDialog({
                                        open: false,
                                        productId: null,
                                        productName: '',
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
