import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    min_stock: number;
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
                search: filters.search,
                [key]: value === 'all' ? undefined : value,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const isLowStock = (stock: Stock) => stock.quantity <= stock.min_stock;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen Stok" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Manajemen Stok
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Kelola dan monitor stok produk di setiap cabang
                        </p>
                    </div>
                    <Link href="/admin/stocks/initialize">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Inisialisasi Stok
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card className="p-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <form onSubmit={handleSearch} className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Cari produk (nama atau code)..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </form>

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
                                <SelectItem value="all">Semua Cabang</SelectItem>
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

                        <Select
                            value={
                                filters.low_stock === true ? 'low' : 'all'
                            }
                            onValueChange={(value) =>
                                handleFilterChange(
                                    'low_stock',
                                    value === 'low' ? true : false,
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status Stok" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="low">
                                    Stok Menipis
                                </SelectItem>
                            </SelectContent>
                        </Select>
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
                                        code
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
                                                {stock.min_stock}
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
