import { CosmosClient, Database, Container } from '@azure/cosmos';
import { validateEnv } from '../config/environment';
import { AppError } from '../middleware/error-handling';

interface Role {
    id: string;
    name: string;
    permissions: Permission[];
    description?: string;
}

interface Permission {
    resource: string;
    actions: string[];
    conditions?: Record<string, any>;
}

interface Policy {
    id: string;
    name: string;
    effect: 'allow' | 'deny';
    roles: string[];
    resources: string[];
    actions: string[];
    conditions?: Record<string, any>;
}

interface UserRole {
    userId: string;
    roleIds: string[];
}

export class AccessControlService {
    private client: CosmosClient;
    private database: Database;
    private rolesContainer: Container;
    private policiesContainer: Container;
    private userRolesContainer: Container;

    constructor() {
        const config = validateEnv();
        this.client = new CosmosClient({
            endpoint: config.COSMOS_DB_CONNECTION_STRING,
            key: process.env.COSMOS_DB_KEY || ''
        });
        this.database = this.client.database(config.COSMOS_DB_DATABASE_NAME);
        this.rolesContainer = this.database.container('Roles');
        this.policiesContainer = this.database.container('Policies');
        this.userRolesContainer = this.database.container('UserRoles');
    }

    async createRole(role: Omit<Role, 'id'>): Promise<Role> {
        try {
            const newRole: Role = {
                id: `role_${Date.now()}`,
                ...role
            };

            await this.rolesContainer.items.create(newRole);
            return newRole;
        } catch (error) {
            throw new AppError(500, 'Failed to create role', 'ROLE_CREATION_ERROR');
        }
    }

    async getRole(roleId: string): Promise<Role> {
        try {
            const { resource } = await this.rolesContainer.item(roleId).read();
            if (!resource) {
                throw new AppError(404, 'Role not found', 'ROLE_NOT_FOUND');
            }
            return resource as Role;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to get role', 'ROLE_READ_ERROR');
        }
    }

    async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
        try {
            const { resource: existingRole } = await this.rolesContainer.item(roleId).read();
            if (!existingRole) {
                throw new AppError(404, 'Role not found', 'ROLE_NOT_FOUND');
            }

            const updatedRole = {
                ...existingRole,
                ...updates
            };

            const { resource } = await this.rolesContainer.item(roleId).replace(updatedRole);
            return resource as Role;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to update role', 'ROLE_UPDATE_ERROR');
        }
    }

    async deleteRole(roleId: string): Promise<void> {
        try {
            await this.rolesContainer.item(roleId).delete();
        } catch (error) {
            throw new AppError(500, 'Failed to delete role', 'ROLE_DELETE_ERROR');
        }
    }

    async createPolicy(policy: Omit<Policy, 'id'>): Promise<Policy> {
        try {
            const newPolicy: Policy = {
                id: `policy_${Date.now()}`,
                ...policy
            };

            await this.policiesContainer.items.create(newPolicy);
            return newPolicy;
        } catch (error) {
            throw new AppError(500, 'Failed to create policy', 'POLICY_CREATION_ERROR');
        }
    }

    async getPolicy(policyId: string): Promise<Policy> {
        try {
            const { resource } = await this.policiesContainer.item(policyId).read();
            if (!resource) {
                throw new AppError(404, 'Policy not found', 'POLICY_NOT_FOUND');
            }
            return resource as Policy;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'Failed to get policy', 'POLICY_READ_ERROR');
        }
    }

    async assignRoleToUser(userId: string, roleId: string): Promise<void> {
        try {
            const { resource: existingUserRole } = await this.userRolesContainer.items
                .query({
                    query: 'SELECT * FROM c WHERE c.userId = @userId',
                    parameters: [{ name: '@userId', value: userId }]
                })
                .fetchNext();

            if (existingUserRole) {
                if (!existingUserRole.roleIds.includes(roleId)) {
                    existingUserRole.roleIds.push(roleId);
                    await this.userRolesContainer.item(existingUserRole.id).replace(existingUserRole);
                }
            } else {
                const newUserRole: UserRole = {
                    id: `userrole_${Date.now()}`,
                    userId,
                    roleIds: [roleId]
                };
                await this.userRolesContainer.items.create(newUserRole);
            }
        } catch (error) {
            throw new AppError(500, 'Failed to assign role to user', 'ROLE_ASSIGNMENT_ERROR');
        }
    }

    async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
        try {
            const { resource: userRole } = await this.userRolesContainer.items
                .query({
                    query: 'SELECT * FROM c WHERE c.userId = @userId',
                    parameters: [{ name: '@userId', value: userId }]
                })
                .fetchNext();

            if (userRole) {
                userRole.roleIds = userRole.roleIds.filter(id => id !== roleId);
                if (userRole.roleIds.length === 0) {
                    await this.userRolesContainer.item(userRole.id).delete();
                } else {
                    await this.userRolesContainer.item(userRole.id).replace(userRole);
                }
            }
        } catch (error) {
            throw new AppError(500, 'Failed to remove role from user', 'ROLE_REMOVAL_ERROR');
        }
    }

    async getUserRoles(userId: string): Promise<Role[]> {
        try {
            const { resource: userRole } = await this.userRolesContainer.items
                .query({
                    query: 'SELECT * FROM c WHERE c.userId = @userId',
                    parameters: [{ name: '@userId', value: userId }]
                })
                .fetchNext();

            if (!userRole) {
                return [];
            }

            const roles: Role[] = [];
            for (const roleId of userRole.roleIds) {
                const role = await this.getRole(roleId);
                roles.push(role);
            }

            return roles;
        } catch (error) {
            throw new AppError(500, 'Failed to get user roles', 'USER_ROLES_ERROR');
        }
    }

    async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
        try {
            const userRoles = await this.getUserRoles(userId);
            const { resources: policies } = await this.policiesContainer.items
                .query({
                    query: 'SELECT * FROM c'
                })
                .fetchAll();

            for (const policy of policies as Policy[]) {
                if (policy.resources.includes(resource) && policy.actions.includes(action)) {
                    const hasRole = userRoles.some(role => policy.roles.includes(role.id));
                    if (hasRole) {
                        return policy.effect === 'allow';
                    }
                }
            }

            return false;
        } catch (error) {
            throw new AppError(500, 'Failed to check permission', 'PERMISSION_CHECK_ERROR');
        }
    }
} 