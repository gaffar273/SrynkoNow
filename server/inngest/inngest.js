import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "SrynkoNow" });

// Create an empty array where we'll export future Inngest functions

const syncUserCreation=inngest.createFunction(
    {id:'sync-user-from-clerk'},
    {event:'clerk/user.created'},
    async ({event})=>{
         const {data}=event
         await prisma.user.create(
            {
                data:{
                    id:data.id,
                    email:data?.email_addresses[0].email_addresses,
                    name:data?.first_name+" "+data?.last_name,
                    image:data?.image_url,
                }
            }
         )
    }
)

//fn to delete user from database

const syncUserDeletion=inngest.createFunction(
    {id:'delete-user-from-clerk'},
    {event:'clerk/user.deleted'},
    async ({event})=>{
         const {data}=event
         await prisma.user.delete(
            {
                where:{
                    id:data.id
                }
            }
         )
    }
)

//fn to update userdata

const syncUserUpdate=inngest.createFunction(
    {id:'update-user-from-clerk'},
    {event:'clerk/user.updated'},
    async ({event})=>{
         const {data}=event
         await prisma.user.update(
            {
                where:{
                    id:data.id
                },
                data:{
                    email:data?.email_addresses[0].email_addresses,
                    name:data?.first_name+" "+data?.last_name,
                    image:data?.image_url,
                }
            }
         )
    }
)
                

export const functions = [syncUserCreation,syncUserDeletion,syncUserUpdate];