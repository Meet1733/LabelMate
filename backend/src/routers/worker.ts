import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { WORKER_JWT_SECRET } from "../config";
import { Router } from "express";
import { workerMiddleware } from "../middleware";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";

const TOTAL_SUBMISSION = 100;

const router = Router();
const prismaClient = new PrismaClient();

prismaClient.$transaction(
    async (prisma) => {
      // Code running in a transaction...
    },
    {
      maxWait: 5000, // default: 2000
      timeout: 10000, // default: 5000
    }
)

router.post("/payout" , workerMiddleware , async (req,res) => {
    //@ts-ignore
    const userId: string = req.userId;
    const worker = await prismaClient.worker.findFirst({
        where:{
            id: Number(userId)
        }
    })

    if(!worker){
        return res.status(403).json({
            message: "User not fpind"
        })
    }
    const address = worker.address

    const txnId = "0x123455666";


    //Should Add a lock here
    await prismaClient.$transaction(async tx => {
        await tx.worker.update({
            where: {
                id: Number(userId)
            },
            data: {
                pending_amount: {
                    decrement: worker.pending_amount
                },
                locked_amount: {
                    increment: worker.pending_amount
                }
            }
        })

        await tx.payouts.create({
            data: {
                user_id: Number(userId),
                amount: worker.pending_amount,
                status: "Processing",
                signature: txnId
            }
        })
    })


    //send the txn to solana blockchain
    res.json({
        message: "Processing Payout",
        amount: worker.pending_amount
    })
})

router.get("/balance" , workerMiddleware , async (req,res) => {
    //@ts-ignore
    const userId:string = req.userId;
    const worker = await prismaClient.worker.findFirst({
        where:{
            id: Number(userId)
        }
    })

    res.json({
        pendingAmount: worker?.pending_amount,
        lockedAmount: worker?.locked_amount
    })
})

router.post("/submission", workerMiddleware, async (req,res) => {
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);
    
    if(parsedBody.success){
        const task = await getNextTask(Number(userId));

        if(!task || task.id !== Number(parsedBody.data.taskId)) {
            return res.status(411).json({
                message: "Incorrect task id"
            })
        }

        const amount = (Number(task.amount) / TOTAL_SUBMISSION).toString();

        const submission = await prismaClient.$transaction(async tx => {
            const submission = await tx.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    worker_id: userId,
                    task_id: Number(parsedBody.data.taskId),
                    amount: Number(amount)
                }
            })

            await prismaClient.worker.update({
                where: {
                    id: userId,
                },
                data:{
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            })
            return submission;
        })

        const nextTask = await getNextTask(Number(userId));
        res.json({
            nextTask,
            amount
        })
    }else{
        res.status(411).json({
            message: "Incorrect inputs"
        })
    }
    
})

router.get("/nextTask" ,workerMiddleware ,async (req,res) => {
    //@ts-ignore
    const userId: string = req.userId;

    const task = await getNextTask(Number(userId));

    if(!task){
        res.status(411).json({
            message: "No more tasks left for you to review"
        })
    }else{
        res.json({
            task
        })
    }
})

router.post('/signin' , async (req,res) => {
    const hardcodedWalletAddress = "oKA6pV6MTDmmd1cQFKxpbvFrCurHSxM28agomEJMeettcdncd";
    
    const existingUser = await prismaClient.worker.findFirst({
        where:{
            address: hardcodedWalletAddress
        }
    })

    if(existingUser){
        const token = jwt.sign({
            userId: existingUser.id 
        },WORKER_JWT_SECRET)

        res.json({
            token
        })
    }else{
        const user = await prismaClient.worker.create({
            data:{
                address: hardcodedWalletAddress,
                pending_amount: 0,
                locked_amount: 0
            }
        })

        const token = jwt.sign({
            userId: user.id 
        },WORKER_JWT_SECRET)

        res.json({
            token
        })
    }
});

export default router;