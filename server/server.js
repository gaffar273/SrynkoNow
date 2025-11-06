import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'
import { inngest, functions } from "./inngest/inngest.js"
import { serve } from "inngest/express"
import workspaceRouter from './routes/workspaceroutes.js';
import { protect } from './middlewires/authMiddlewire.js';

const app = express();

app.use(clerkMiddleware())
app.use(express.json())
app.use(cors());

app.use("/api/inngest", serve({ client: inngest, functions }));

app.get('/', (req, res) => {
    res.json({ message: "server is running" })
})

app.use('/api/workspaces', protect, workspaceRouter)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})


