import { PrismaClient } from "@prisma/client";
import jwt, { sign } from "jsonwebtoken";
import { TOTAL_DECIMALS, WORKER_JWT_SECRET } from "../config";
import { Router } from "express";
import { workerMiddleware } from "../middleware";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";
import nacl from "tweetnacl";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { decode } from "bs58";
require('dotenv').config();

const connection = new Connection("https://api.devnet.solana.com");

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

    try {
        const worker = await prismaClient.worker.findUnique({
            where:{
                id: Number(userId)
            }
        });

        if(!worker){
            throw new Error("Worker not found");
        }        

        if (worker.pending_amount < 3000) {
            throw new Error(
              "Your need to have atleast 0.03 sol as pending amount to withdraw."
            );
        }

        const walletAddress = process.env.PAYMENT_WALLET_ADDRESS;
        if (!walletAddress) {
            throw new Error('PAYMENT_WALLET_ADDRESS is not defined in the environment variables.');
        }

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: new PublicKey(walletAddress),
                toPubkey: new PublicKey(worker.address),
                lamports: 1000_000_000 * worker.pending_amount / TOTAL_DECIMALS, //1 SOL = 1e9 Lamports
            })
        );
        
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('PRIVATE_KEY is not defined in the environment variables.');
        }
        const keypair = Keypair.fromSecretKey(decode(privateKey));
    
        let signature = "";
        try{
            signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [keypair]
            )
        } catch(e) {
            return res.json({
                message: "Transaction failed"
            })
        }
        
        
        //Should Add a lock here to avoid double spending
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
                    worker_id: Number(userId),
                    amount: worker.pending_amount,
                    status: "Success",
                    signature: signature
                }
            })
        })

        return res.status(200).json({
                message: `Your pending amount of ${worker.pending_amount/TOTAL_DECIMALS} SOL is locked and is getting processed.`,
              });
        }catch (error) {
            return res.status(500).json({ message: (error as Error).message });
        }
});

router.get("/payout" , workerMiddleware , async(req,res) => {
    //@ts-ignore
    const userId:string = req.userId;
    const payouts = await prismaClient.payouts.findMany({
        where: {
            worker_id: Number(userId)
        }
    })
    return res.json(payouts);
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

    try{
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
    }catch(e){
        return res.status(500).json({
            message: "INTERNAL_SERVER_ERROR",
            description: (e as Error).message,
        })
    }
})

router.get('/me' , workerMiddleware , async(req,res) => {
    //@ts-ignore
    const workerId = req.userId;

    const existingUser = await prismaClient.worker.findFirst({
        where: {
            id: Number(workerId),
        }
    })

    if(!existingUser){
        return res.status(404).json({
            message: "Worker not found"
        })
    }

    const payouts = await prismaClient.payouts.findMany({
        where: {
            worker_id: Number(workerId),
        }
    });

    let totalEarnings = 0;

    payouts.forEach((payout) => {
        totalEarnings += payout.amount;
    })

    res.json({
        ...existingUser,
        locked: existingUser.locked_amount / TOTAL_DECIMALS,
        amount: existingUser.pending_amount/TOTAL_DECIMALS,
        earning: totalEarnings/TOTAL_DECIMALS,
    })
})

router.post('/signin' , async (req,res) => {
    const {publicKey , signature} = req.body;
    const message = new TextEncoder().encode("Sign in to LabelMate as a worker");
    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );

    if(!result){
        return res.status(411).json({
            message: "Incorrect signature"
        })
    }
    
    const existingUser = await prismaClient.worker.findFirst({
        where:{
            address: publicKey
        }
    })

    if(existingUser){
        const token = jwt.sign({
            userId: existingUser.id 
        },WORKER_JWT_SECRET)

        res.json({
            token,
            amount: existingUser.pending_amount 
        })
    }else{
        const user = await prismaClient.worker.create({
            data:{
                address: publicKey,
                pending_amount: 0,
                locked_amount: 0
            }
        })

        const token = jwt.sign({
            userId: user.id 
        },WORKER_JWT_SECRET)

        res.json({
            token,
            amount: 0
        })
    }
});

export default router;