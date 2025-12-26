import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

export function usePermission() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    const permissions = user?.permissions || [];
    const roles = user?.roles || [];

    /**
     * Check if user has a specific permission
     */
    const can = (permission: string): boolean => {
        // Super Admin has all permissions
        if (roles.includes('Super Admin')) {
            return true;
        }
        return permissions.includes(permission);
    };

    /**
     * Check if user has any of the given permissions
     */
    const hasAnyPermission = (permissionList: string[]): boolean => {
        // Super Admin has all permissions
        if (roles.includes('Super Admin')) {
            return true;
        }
        return permissionList.some((permission) => permissions.includes(permission));
    };

    /**
     * Check if user has all of the given permissions
     */
    const hasAllPermissions = (permissionList: string[]): boolean => {
        // Super Admin has all permissions
        if (roles.includes('Super Admin')) {
            return true;
        }
        return permissionList.every((permission) => permissions.includes(permission));
    };

    /**
     * Check if user has a specific role
     */
    const hasRole = (role: string): boolean => {
        return roles.includes(role);
    };

    /**
     * Check if user has any of the given roles
     */
    const hasAnyRole = (roleList: string[]): boolean => {
        return roleList.some((role) => roles.includes(role));
    };

    /**
     * Check if user is Super Admin
     */
    const isSuperAdmin = (): boolean => {
        return roles.includes('Super Admin');
    };

    /**
     * Check if user is Admin Cabang
     */
    const isAdminCabang = (): boolean => {
        return roles.includes('Admin Cabang');
    };

    /**
     * Check if user is Sales
     */
    const isSales = (): boolean => {
        return roles.includes('Sales');
    };

    return {
        can,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
        isSuperAdmin,
        isAdminCabang,
        isSales,
        permissions,
        roles,
    };
}
