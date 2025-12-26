import { ReactNode } from 'react';
import { usePermission } from '@/hooks/use-permission';

interface CanProps {
    /** Single permission or array of permissions to check */
    permission?: string | string[];
    /** Single role or array of roles to check */
    role?: string | string[];
    /** If true, user must have ALL permissions (default: false - any permission) */
    matchAll?: boolean;
    /** Content to render if user has permission */
    children: ReactNode;
    /** Optional fallback content if user doesn't have permission */
    fallback?: ReactNode;
}

/**
 * Component for conditional rendering based on user permissions/roles
 *
 * @example
 * // Check single permission
 * <Can permission="view-users">
 *   <UserList />
 * </Can>
 *
 * @example
 * // Check multiple permissions (any)
 * <Can permission={['create-users', 'edit-users']}>
 *   <UserForm />
 * </Can>
 *
 * @example
 * // Check multiple permissions (all required)
 * <Can permission={['view-users', 'edit-users']} matchAll>
 *   <UserEditForm />
 * </Can>
 *
 * @example
 * // Check role
 * <Can role="Super Admin">
 *   <AdminPanel />
 * </Can>
 *
 * @example
 * // With fallback
 * <Can permission="view-reports" fallback={<AccessDenied />}>
 *   <Reports />
 * </Can>
 */
export function Can({ permission, role, matchAll = false, children, fallback = null }: CanProps) {
    const { can, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = usePermission();

    let hasAccess = false;

    // Check permissions
    if (permission) {
        if (Array.isArray(permission)) {
            hasAccess = matchAll
                ? hasAllPermissions(permission)
                : hasAnyPermission(permission);
        } else {
            hasAccess = can(permission);
        }
    }

    // Check roles (if no permission specified or as additional check)
    if (role && !hasAccess) {
        if (Array.isArray(role)) {
            hasAccess = hasAnyRole(role);
        } else {
            hasAccess = hasRole(role);
        }
    }

    // If neither permission nor role specified, don't render
    if (!permission && !role) {
        return <>{children}</>;
    }

    return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component that renders children only if user CANNOT access
 * Useful for showing upgrade prompts or access denied messages
 */
export function Cannot({ permission, role, matchAll = false, children }: Omit<CanProps, 'fallback'>) {
    return (
        <Can permission={permission} role={role} matchAll={matchAll} fallback={children}>
            {null}
        </Can>
    );
}
