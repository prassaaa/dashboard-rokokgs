import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Users,
    Building2,
    Tags,
    Package,
    Warehouse,
    Receipt,
    DollarSign,
    TrendingUp,
    Award,
} from 'lucide-react';
import AppLogo from './app-logo';

// Dashboard
const dashboardNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutGrid,
    },
];

// Master Data - Pengelolaan Data Dasar
const masterDataNavItems: NavItem[] = [
    {
        title: 'Pengguna',
        href: '/admin/users',
        icon: Users,
    },
    {
        title: 'Cabang',
        href: '/admin/branches',
        icon: Building2,
    },
];

// Produk & Inventori
const inventoryNavItems: NavItem[] = [
    {
        title: 'Kategori',
        href: '/admin/categories',
        icon: Tags,
    },
    {
        title: 'Produk',
        href: '/admin/products',
        icon: Package,
    },
    {
        title: 'Stok',
        href: '/admin/stocks',
        icon: Warehouse,
    },
];

// Transaksi & Keuangan
const transactionNavItems: NavItem[] = [
    {
        title: 'Transaksi',
        href: '/admin/transactions',
        icon: Receipt,
    },
    {
        title: 'Komisi',
        href: '/admin/commissions',
        icon: DollarSign,
    },
];

// Laporan
const reportsNavItems: NavItem[] = [
    {
        title: 'Penjualan',
        href: '/admin/reports/sales',
        icon: TrendingUp,
    },
    {
        title: 'Produk',
        href: '/admin/reports/products',
        icon: Package,
    },
    {
        title: 'Performa Sales',
        href: '/admin/reports/sales-performance',
        icon: Award,
    },
    {
        title: 'Komisi',
        href: '/admin/reports/commissions',
        icon: DollarSign,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={dashboardNavItems} />
                <NavMain
                    items={masterDataNavItems}
                    title="Master Data"
                />
                <NavMain
                    items={inventoryNavItems}
                    title="Produk & Inventori"
                />
                <NavMain
                    items={transactionNavItems}
                    title="Transaksi & Keuangan"
                />
                <NavMain
                    items={reportsNavItems}
                    title="Laporan"
                />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
