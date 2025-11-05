import { Inngest } from "inngest";
import prisma from "../configs/prisma";

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

export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdate];