import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "SrynkoNow" });

// Function to sync user creation from Clerk
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event }) => {
        const { data } = event;
        
        try {
            await prisma.user.create({
                data: {
                    id: data.id,
                    email: data?.email_addresses?.[0]?.email_address || null,
                    name: data?.first_name && data?.last_name 
                        ? `${data.first_name} ${data.last_name}`.trim()
                        : data?.username || null,
                    username: data?.username || null,
                    image: data?.image_url || "",
                }
            });
            console.log(`✅ User created: ${data.id}`);
        } catch (error) {
            console.error('❌ Error creating user:', error);
            throw error;
        }
    }
);

// Function to delete user from database
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-from-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event }) => {
        const { data } = event;
        
        try {
            await prisma.user.delete({
                where: {
                    id: data.id
                }
            });
            console.log(`✅ User deleted: ${data.id}`);
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            throw error;
        }
    }
);

// Function to update user data
const syncUserUpdate = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event }) => {
        const { data } = event;
        
        try {
            await prisma.user.update({
                where: {
                    id: data.id
                },
                data: {
                    email: data?.email_addresses?.[0]?.email_address || null,
                    name: data?.first_name && data?.last_name 
                        ? `${data.first_name} ${data.last_name}`.trim()
                        : data?.username || null,
                    username: data?.username || null,
                    image: data?.image_url || "",
                }
            });
            console.log(`✅ User updated: ${data.id}`);
        } catch (error) {
            console.error('❌ Error updating user:', error);
            throw error;
        }
    }
);

// Function to sync workspace from Clerk (handles BOTH create and update via organization.updated event)
const syncWorkspace = inngest.createFunction(
    { id: 'sync-workspace-from-clerk' },
    { event: 'clerk/organization.updated' },
    { event: 'clerk/organization.created' }, // ALSO listen to created event
    async ({ event }) => {
        const { data } = event;
        
        try {
            // Use upsert - if workspace doesn't exist, create it; if it does, update it
            const workspace = await prisma.workspace.upsert({
                where: { id: data.id },
                update: {
                    name: data.name,
                    slug: data.slug,
                    image_url: data.image_url || data.logo_url || ""
                },
                create: {
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    ownerId: data.created_by,
                    image_url: data.image_url || data.logo_url || ""
                }
            });

            // Check if workspace member (owner) already exists
            const existingMember = await prisma.workspaceMember.findFirst({
                where: {
                    userId: data.created_by,
                    workspaceId: data.id
                }
            });

            // Create owner as admin if they don't exist (this means it's a new workspace)
            if (!existingMember && data.created_by) {
                await prisma.workspaceMember.create({
                    data: {
                        userId: data.created_by,
                        workspaceId: data.id,
                        role: "ADMIN"
                    }
                });
                console.log(`✅ Workspace created with admin: ${data.id}`);
            } else {
                console.log(`✅ Workspace updated: ${data.id}`);
            }
        } catch (error) {
            console.error('❌ Error syncing workspace:', error);
            throw error;
        }
    }
);



// Function to delete workspace from database
const syncWorkspaceDeletion = inngest.createFunction(
    { id: 'delete-workspace-from-clerk' },
    { event: 'clerk/organization.deleted' },
    async ({ event }) => {
        const { data } = event;
        
        try {
            await prisma.workspace.delete({
                where: { id: data.id }
            });
            console.log(`✅ Workspace deleted: ${data.id}`);
        } catch (error) {
            console.error('❌ Error deleting workspace:', error);
            throw error;
        }
    }
);

// Function to add new workspace member (handles organizationMembership.created event)
const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: 'sync-workspace-member-from-clerk' },
    { event: 'clerk/organizationMembership.created' },
    async ({ event }) => {
        const { data } = event;
        
        try {
            await prisma.workspaceMember.create({
                data: {
                    userId: data.user_id,
                    workspaceId: data.organization_id,
                    role: String(data.role || data.role_name).toUpperCase()
                }
            });
            console.log(`✅ Workspace member created: ${data.user_id} in ${data.organization_id}`);
        } catch (error) {
            console.error('❌ Error creating workspace member:', error);
            throw error;
        }
    }
);

// Function to update workspace member role
const syncWorkspaceMemberUpdate = inngest.createFunction(
    { id: 'update-workspace-member-from-clerk' },
    { event: 'clerk/organizationMembership.updated' },
    async ({ event }) => {
        const { data } = event;
        
        try {
            await prisma.workspaceMember.update({
                where: {
                    userId_workspaceId: {
                        userId: data.user_id,
                        workspaceId: data.organization_id
                    }
                },
                data: {
                    role: String(data.role || data.role_name).toUpperCase()
                }
            });
            console.log(`✅ Workspace member updated: ${data.user_id} in ${data.organization_id}`);
        } catch (error) {
            console.error('❌ Error updating workspace member:', error);
            throw error;
        }
    }
);

// Function to remove workspace member
const syncWorkspaceMemberDeletion = inngest.createFunction(
    { id: 'delete-workspace-member-from-clerk' },
    { event: 'clerk/organizationMembership.deleted' },
    async ({ event }) => {
        const { data } = event;
        
        try {
            await prisma.workspaceMember.delete({
                where: {
                    userId_workspaceId: {
                        userId: data.user_id,
                        workspaceId: data.organization_id
                    }
                }
            });
            console.log(`✅ Workspace member deleted: ${data.user_id} from ${data.organization_id}`);
        } catch (error) {
            console.error('❌ Error deleting workspace member:', error);
            throw error;
        }
    }
);

// Export all functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdate,
    syncWorkspace,  // Single function handles both create and update
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation,
    syncWorkspaceMemberUpdate,
    syncWorkspaceMemberDeletion
];