import prisma from "../configs/prisma.js"


//Get alll workspaces
export const getUserWorkspaces = async (req, res) => {
    try {
        const { userId } = await req.auth()
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId } }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: { include: { assignee: true, comments: { include: { uer: true } } } },
                        members: { include: { uer: true } }
                    }
                },
                owner:true
            }
        });
        res.json({workspaces})
    }catch (error) {
        res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
} 

//Add member to woorkspaces
export const addMember=async(req,res)=>{
    try{
        const { userId } = await req.auth()
        const {email,role,workspaceId,message}=req.body;

        //check if user exist
        const user=await prisma.user.findUnique({
            where:{email}
        });
        if(!user){
            return res.status(404).json({message:"User not fopund"})
        }
        if(!role || !workspaceId){
            return res.status(400).json({message:"role or worksapaceId missing"})
        }
        if(!['ADMIN','MEMBER'].includes(role)){
             return res.status(400).json({message:"Invalid role"})
        }

        //fetch workspace 
        const workspace=await prisma.workspace.findUnique({
            where:{id:workspaceId},include:{members:true}
        })

        if(!workspace){
            res.status(404).json({message:"workspace not found"})
        }

        //check creator admin or not
        if(!workspace.members.find((member)=>member.userId === userId && member.role==="ADMIN")){
            return res.status(401).json({message:"Only admin can add members"})
        }

        //check if user is alreadu member
        const existingMember=await prisma.workspace.members.find((member)=>member.userId===userId)

        if(existingMember){
            return res.status(400).json({message:"User is already a member"})
        }

        //add member
        const member= await prisma.workspaceMember.create({
            data:{
                userId:user.id,
                workspaceId,
                role,
                message
            }
        })

        res.json({member,message:"Member added successfully"})
            
    }catch(error){
        res.status(500).json({message:"someting went wrong"})
    }
}