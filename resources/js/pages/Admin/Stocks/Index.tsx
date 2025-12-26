import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Can } from '@/components/Can';
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
import { AlertTriangle, Edit, Package, Plus, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';

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

interface PaginatedStocks {
    data: Stock[];
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
    stocks: PaginatedStocks;
    branches: Branch[];
    filters: {
        branch_id?: string;
        low_stock?: boolean;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Manajemen Stok', href: '/admin/stocks' },
];

export default function Index({ stocks, branches, filters }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/stocks',
            {
                search,
                branch_id: filters.branch_id,
                low_stock: filters.low_stock,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleFilterChange = (key: string, value: string | boolean) => {
        router.get(
            '/admin/stocks',
            {
                ...filters,
                [key]: value === 'all' ? undefined : value,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const isLowStock = (stock: Stock) => stock.quantity <= stock.minimum_stock;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Stok" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Manajemen Stok</h1>
                        <p className="text-muted-foreground">
                            Kelola dan monitor stok produk di setiap cabang
                        </p>
                    </div>
                    <Can permission="create-stocks">
                        <Button asChild>
                            <Link href="/admin/stocks/initialize">
                                <Plus className="mr-2 size-4" />
                                Inisialisasi Stok
                            </Link>
                        </Button>
                    </Can>
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
                                    placeholder="Nama produk atau kode..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" variant="secondary">
                                    <Search className="size-4" />
                                </Button>
                            </div>
                        </form>

                        {/* Branch Filter */}
                        <div className="w-full md:w-48">
                            <label className="mb-2 block text-sm font-medium">
                                Cabang
                            </label>
                            <Select
                                value={filters.branch_id || 'all'}
                                onValueChange={(value) =>
                                    handleFilterChange('branch_id', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Cabang" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Cabang
                                    </SelectItem>
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
                        </div>

                        {/* Status Filter */}
                        <div className="w-full md:w-48">
                            <label className="mb-2 block text-sm font-medium">
                                Status Stok
                            </label>
                            <Select
                                value={filters.low_stock ? 'low' : 'all'}
                                onValueChange={(value) => {
                                    if (value === 'low') {
                                        handleFilterChange('low_stock', true);
                                    } else {
                                        handleFilterChange('low_stock', 'all');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Status
                                    </SelectItem>
                                    <SelectItem value="low">
                                        Stok Menipis
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </Card>

                {/* Table */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold">
                                        Produk
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">
                                        Kode
                                    </th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">
                                        Cabang
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">
                                        Jumlah
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">
                                        Min. Stok
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {stocks.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-muted-foreground"
                                        >
                                            <Package className="mx-auto mb-4 h-12 w-12 opacity-20" />
                                            <p className="text-lg font-medium">
                                                Tidak ada data stok
                                            </p>
                                            <p className="mt-1 text-sm">
                                                Mulai dengan menginisialisasi stok
                                                produk
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    stocks.data.map((stock) => (
                                        <tr
                                            key={stock.id}
                                            className="hover:bg-muted/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium">
                                                    {stock.product.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <code className="rounded bg-muted px-2 py-1 text-sm">
                                                    {stock.product.code}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4">
                                                {stock.branch.name}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={
                                                        isLowStock(stock)
                                                            ? 'font-bold text-destructive'
                                                            : 'font-medium'
                                                    }
                                                >
                                                    {stock.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-muted-foreground">
                                                {stock.minimum_stock}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isLowStock(stock) ? (
                                                    <Badge
                                                        variant="destructive"
                                                        className="gap-1"
                                                    >
                                                        <AlertTriangle className="h-3 w-3" />
                                                        Menipis
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary">
                                                        Normal
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Can permission="stock-opname">
                                                        <Link
                                                            href={`/admin/stocks/${stock.id}/adjust`}
                                                        >
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                            >
                                                                <Edit className="mr-1 h-3 w-3" />
                                                                Sesuaikan
                                                            </Button>
                                                        </Link>
                                                    </Can>
                                                    <Link
                                                        href={`/admin/stocks/${stock.id}/movements`}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            Riwayat
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {stocks.data.length > 0 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <div className="text-sm text-muted-foreground">
                                Menampilkan {stocks.data.length} dari{' '}
                                {stocks.total} stok
                            </div>
                            <div className="flex gap-2">
                                {stocks.links.map((link, index) => {
                                    if (!link.url) return null;

                                    return (
                                        <Button
                                            key={index}
                                            variant={
                                                link.active ? 'default' : 'outline'
                                            }
                                            size="sm"
                                            onClick={() =>
                                                router.get(link.url!)
                                            }
                                            disabled={!link.url}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
