import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle,
    DollarSign,
    Package,
    ShoppingCart,
    TrendingUp,
    Users,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface Stats {
    total_users: number;
    total_sales: number;
    total_branches: number;
    total_products: number;
}

interface SalesStats {
    total_transactions: number;
    total_revenue: number;
    average_transaction: number;
    completed_transactions: number;
}

interface RecentTransaction {
    id: number;
    customer_name: string;
    total: number;
    status: string;
    sales_name: string;
    branch_name: string;
    created_at: string;
}

interface LowStockAlert {
    id: number;
    product_name: string;
    product_code: string;
    quantity: number;
    min_stock: number;
    branch_name: string;
}

interface PendingApprovals {
    pending_users: number;
    pending_commissions: number;
}

interface SalesTrendItem {
    date: string;
    transactions: number;
    revenue: number;
}

interface DashboardProps {
    stats: Stats;
    salesStats: SalesStats;
    recentTransactions: RecentTransaction[];
    lowStockAlerts: LowStockAlert[];
    pendingApprovals: PendingApprovals;
    salesTrend: SalesTrendItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '/admin/dashboard',
    },
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function getStatusColor(
    status: string,
): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
    const statusMap: Record<
        string,
        'default' | 'secondary' | 'success' | 'warning' | 'destructive'
    > = {
        pending: 'warning',
        approved: 'secondary',
        completed: 'success',
        rejected: 'destructive',
    };
    return statusMap[status] || 'default';
}

export default function AdminDashboard({
    stats,
    salesStats,
    recentTransactions,
    lowStockAlerts,
    pendingApprovals,
    salesTrend,
}: DashboardProps) {
    // Format chart data
    const chartData = salesTrend.map((item) => ({
        date: format(parseISO(item.date), 'dd MMM', { locale: idLocale }),
        revenue: item.revenue,
        transactions: item.transactions,
    }));
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard Admin" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold">Dashboard Admin</h1>
                    <p className="text-muted-foreground">
                        Ringkasan dan statistik sistem manajemen penjualan
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Pengguna
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total_users}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {stats.total_sales} Sales Aktif
                                </p>
                            </div>
                            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                                <Users className="size-6 text-blue-600 dark:text-blue-300" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Revenue Bulan Ini
                                </p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(salesStats.total_revenue)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {salesStats.total_transactions} transaksi
                                </p>
                            </div>
                            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                                <DollarSign className="size-6 text-green-600 dark:text-green-300" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Rata-rata Transaksi
                                </p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(
                                        salesStats.average_transaction,
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {salesStats.completed_transactions} selesai
                                </p>
                            </div>
                            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                                <TrendingUp className="size-6 text-purple-600 dark:text-purple-300" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Produk Aktif
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total_products}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {stats.total_branches} cabang
                                </p>
                            </div>
                            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                                <Package className="size-6 text-orange-600 dark:text-orange-300" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Pending Approvals Alert */}
                {(pendingApprovals.pending_users > 0 ||
                    pendingApprovals.pending_commissions > 0) && (
                    <Card className="border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                                    Menunggu Persetujuan
                                </h3>
                                <div className="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                                    {pendingApprovals.pending_users > 0 && (
                                        <p>
                                            • {pendingApprovals.pending_users}{' '}
                                            registrasi pengguna baru
                                        </p>
                                    )}
                                    {pendingApprovals.pending_commissions >
                                        0 && (
                                        <p>
                                            •{' '}
                                            {
                                                pendingApprovals.pending_commissions
                                            }{' '}
                                            komisi menunggu persetujuan
                                        </p>
                                    )}
                                </div>
                                <div className="mt-3 flex gap-2">
                                    {pendingApprovals.pending_users > 0 && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-400 dark:text-yellow-300 dark:hover:bg-yellow-900"
                                        >
                                            <Link href="/admin/users">
                                                Lihat Pengguna
                                            </Link>
                                        </Button>
                                    )}
                                    {pendingApprovals.pending_commissions >
                                        0 && (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-400 dark:text-yellow-300 dark:hover:bg-yellow-900"
                                        >
                                            <Link href="/admin/commissions">
                                                Lihat Komisi
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Sales Trend Chart */}
                <Card className="p-6">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold">
                            Tren Penjualan 7 Hari Terakhir
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Revenue dan jumlah transaksi harian
                        </p>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient
                                    id="colorRevenue"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#10b981"
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#10b981"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="date"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis style={{ fontSize: '12px' }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                formatter={(value, name) => {
                                    if (!value) return ['0', name || ''];
                                    if (name === 'revenue') {
                                        return [
                                            formatCurrency(Number(value)),
                                            'Revenue',
                                        ];
                                    }
                                    return [value, 'Transaksi'];
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>

                {/* Two Column Layout */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Transactions */}
                    <Card className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Transaksi Terbaru
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    10 transaksi terakhir
                                </p>
                            </div>
                            <Button asChild size="sm" variant="ghost">
                                <Link href="/admin/transactions">
                                    Lihat Semua
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {recentTransactions.length > 0 ? (
                                recentTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <ShoppingCart className="size-4 text-muted-foreground" />
                                                <p className="font-medium">
                                                    {transaction.customer_name}
                                                </p>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>
                                                    {transaction.sales_name}
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {transaction.branch_name}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {format(
                                                    parseISO(
                                                        transaction.created_at,
                                                    ),
                                                    'dd MMM yyyy HH:mm',
                                                    { locale: idLocale },
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">
                                                {formatCurrency(
                                                    transaction.total,
                                                )}
                                            </p>
                                            <Badge
                                                variant={getStatusColor(
                                                    transaction.status,
                                                )}
                                                className="mt-1"
                                            >
                                                {transaction.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">
                                    Belum ada transaksi
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Low Stock Alerts */}
                    <Card className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Peringatan Stok Rendah
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Produk yang perlu direstock
                                </p>
                            </div>
                            <Button asChild size="sm" variant="ghost">
                                <Link href="/admin/stocks">
                                    Kelola Stok
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {lowStockAlerts.length > 0 ? (
                                lowStockAlerts.map((stock) => (
                                    <div
                                        key={stock.id}
                                        className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="size-4 text-red-600 dark:text-red-400" />
                                                <p className="font-medium text-red-900 dark:text-red-100">
                                                    {stock.product_name}
                                                </p>
                                            </div>
                                            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                                code: {stock.product_code}
                                            </p>
                                            <p className="text-xs text-red-600 dark:text-red-400">
                                                {stock.branch_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-red-700 dark:text-red-300">
                                                {stock.quantity}
                                            </p>
                                            <p className="text-xs text-red-600 dark:text-red-400">
                                                Min: {stock.min_stock}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center gap-2 py-8 text-green-600">
                                    <CheckCircle className="size-5" />
                                    <span className="font-medium">
                                        Semua stok aman
                                    </span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
