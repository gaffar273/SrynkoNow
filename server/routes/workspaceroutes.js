import express from 'express';
import { addMember, getUserWorkspaces } from '../controllers/workSpaceController.js';

const workspaceRouter=express.Router()

workspaceRouter.get('/',getUserWorkspaces)
workspaceRouter.post('/add-member',addMember)

export default workspaceRouter;