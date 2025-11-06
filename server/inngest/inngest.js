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
                    email: data?.email_addresses?.[0]?.email_address || null, // Fixed: email_address not email_addresses
                    name: data?.first_name && data?.last_name 
                        ? `${data.first_name} ${data.last_name}`.trim()
                        : data?.username || null, // Use username if no name
                    username: data?.username || null, // Add username field
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
                    email: data?.email_addresses?.[0]?.email_address || null, // Fixed: email_address not email_addresses
                    name: data?.first_name && data?.last_name 
                        ? `${data.first_name} ${data.last_name}`.trim()
                        : data?.username || null, // Use username if no name
                    username: data?.username || null, // Add username field
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

//fn to to save workspace data to database
const syncWorkspaceCreation = inngest.createFunction(
    {id:'sync-workspace-from-clerk'},
    {event:'clerk/organization.created'},  // ✅ Check Clerk's actual event name
    async ({event}) => {
        const {data} = event;
        try {
            await prisma.workspace.create({
                data:{
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    ownerId: data.created_by,
                    image_url: data.image_url
                }
            });

            // Add creator as ADMIN 
            await prisma.workspaceMember.create({
                data: {  // ✅ Fixed typo
                    userId: data.created_by,  // ✅ Fixed field name
                    workspaceId: data.id,
                    role: "ADMIN"
                }
            });
            console.log(`✅ Workspace created: ${data.id}`);
        } catch (error) {
            console.error('❌ Error creating workspace:', error);
            throw error;
        }
    }
);

//fn to uopdate workspace data in database
const syncWorkspaceUpdate = inngest.createFunction(
    {id:'update-workspace-from-clerk'},  // ✅ Fixed typo
    {event:'clerk/organization.updated'},
    async ({event}) => {
        const {data} = event;
        try {
            await prisma.workspace.update({
                where: {id: data.id},
                data: {
                    name: data.name,
                    slug: data.slug,
                    image_url: data.image_url
                }
            });
            console.log(`✅ Workspace updated: ${data.id}`);
        } catch (error) {
            console.error('❌ Error updating workspace:', error);
            throw error;
        }
    }
);

//fn to detlete workspace fro database
const syncWorkspaceDeletion = inngest.createFunction(
    {id:'delete-workspace-from-clerk'},  // ✅ Fixed typo
    {event:'clerk/organization.deleted'},
    async ({event}) => {  // ✅ Removed duplicate async
        const {data} = event;
        try {
            await prisma.workspace.delete({
                where: {id: data.id}
            });
            console.log(`✅ Workspace deleted: ${data.id}`);
        } catch (error) {
            console.error('❌ Error deleting workspace:', error);
            throw error;
        }
    }
);

//add new workpacemember
const syncWorkSpaceMemberCreation = inngest.createFunction(
    {id:'sync-workspace-member-from-clerk'},  // ✅ Fixed typo
    {event:'clerk/organizationMembership.created'},  // ✅ Fixed event name
    async({event}) => {
        const {data} = event;
        try {
            await prisma.workspaceMember.create({
                data: {
                    userId: data.user_id,
                    workspaceId: data.organization_id,
                    role: String(data.role).toUpperCase()  // ✅ Check if it's "role" or "role_name"
                }
            });
            console.log(`✅ Workspace member created: ${data.user_id}`);
        } catch (error) {
            console.error('❌ Error creating workspace member:', error);
            throw error;
        }
    }
);
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdate,syncWorkspaceCreation,syncWorkspaceUpdate,syncWorkspaceDeletion,syncWorkSpaceMemberCreation];