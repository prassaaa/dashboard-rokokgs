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
import { usePermission } from '@/hooks/use-permission';
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
    TrendingUp,
    Award,
    MapPin,
    Target,
    UserCheck,
} from 'lucide-react';
import AppLogo from './app-logo';

// Dashboard
const dashboardNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutGrid,
        permission: 'view-dashboard',
    },
];

// Master Data - Pengelolaan Data Dasar
const masterDataNavItems: NavItem[] = [
    {
        title: 'Pengguna',
        href: '/admin/users',
        icon: Users,
        permission: 'view-users',
    },
    {
        title: 'Cabang',
        href: '/admin/branches',
        icon: Building2,
        permission: 'view-branches',
    },
    {
        title: 'Area',
        href: '/admin/areas',
        icon: MapPin,
        permission: 'view-areas',
    },
];

// Produk & Inventori
const inventoryNavItems: NavItem[] = [
    {
        title: 'Kategori',
        href: '/admin/categories',
        icon: Tags,
        permission: 'view-products',
    },
    {
        title: 'Produk',
        href: '/admin/products',
        icon: Package,
        permission: 'view-products',
    },
    {
        title: 'Stok',
        href: '/admin/stocks',
        icon: Warehouse,
        permission: 'view-stocks',
    },
];

// Transaksi & Keuangan
const transactionNavItems: NavItem[] = [
    {
        title: 'Transaksi',
        href: '/admin/transactions',
        icon: Receipt,
        permission: 'view-sales-transactions',
    },
    {
        title: 'Kunjungan',
        href: '/admin/visits',
        icon: UserCheck,
        permission: 'view-sales-transactions',
    },
    {
        title: 'Target',
        href: '/admin/targets',
        icon: Target,
        permission: 'view-targets',
    },
];

// Laporan
const reportsNavItems: NavItem[] = [
    {
        title: 'Penjualan',
        href: '/admin/reports/sales',
        icon: TrendingUp,
        permission: 'view-reports',
    },
    {
        title: 'Produk',
        href: '/admin/reports/products',
        icon: Package,
        permission: 'view-reports',
    },
    {
        title: 'Performa Sales',
        href: '/admin/reports/sales-performance',
        icon: Award,
        permission: 'view-reports',
    },
];

export function AppSidebar() {
    const { can, hasAnyPermission } = usePermission();

    // Filter function to check if user has permission for nav item
    const filterByPermission = (items: NavItem[]): NavItem[] => {
        return items.filter((item) => {
            if (!item.permission) return true;
            if (Array.isArray(item.permission)) {
                return hasAnyPermission(item.permission);
            }
            return can(item.permission);
        });
    };

    // Filter all nav items
    const filteredDashboard = filterByPermission(dashboardNavItems);
    const filteredMasterData = filterByPermission(masterDataNavItems);
    const filteredInventory = filterByPermission(inventoryNavItems);
    const filteredTransaction = filterByPermission(transactionNavItems);
    const filteredReports = filterByPermission(reportsNavItems);

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
                {filteredDashboard.length > 0 && (
                    <NavMain items={filteredDashboard} />
                )}
                {filteredMasterData.length > 0 && (
                    <NavMain items={filteredMasterData} title="Master Data" />
                )}
                {filteredInventory.length > 0 && (
                    <NavMain items={filteredInventory} title="Produk & Inventori" />
                )}
                {filteredTransaction.length > 0 && (
                    <NavMain items={filteredTransaction} title="Transaksi & Keuangan" />
                )}
                {filteredReports.length > 0 && (
                    <NavMain items={filteredReports} title="Laporan" />
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
