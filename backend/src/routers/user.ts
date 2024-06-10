import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, TOTAL_DECIMALS } from "../config";
import { authMiddleware } from "../middleware";
import { createTaskInput } from "../types";


const DEFALUT_TITLE = "Select the most clickable thumbnail";

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


router.get('/task' , authMiddleware ,  async (req,res) => {
    // @ts-ignore
    const taskId: string = req.query.taskId;

    //@ts-ignore
    const userId: string = req.userId;

    const taskDetails = await prismaClient.task.findFirst({
        where:{
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    })

    if(!taskDetails){
        return res.status(411).json({
            message: "You don't have access to this task"
        })
    }

    const respnoses = await prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId)
        },
        include: {
            Option: true
        }
    })

    const result: Record<string, {
        count: number;
        option: {
            imageUrl: string
        }
    }> = {};

    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {    
                // @ts-ignore
                imageUrl: option.image_url
            }
        }
    })

    respnoses.forEach(r => {
        result[r.option_id].count++;
    })

    res.json({
        result,
        taskDetails
     })
})

router.post("/task" , authMiddleware , async (req,res) => {
    
    // @ts-ignore
    const userId = req.userId; 

    //validate inputs from user
    const body = req.body;

    const parseData = createTaskInput.safeParse(body);

    if(!parseData.success){
        return res.status(411).json({
            message: "You've sent the wrong inputs"
        })
    }
    
    //parse the signature here to ensure the person has paid $50

    let response = await prismaClient.$transaction(async tx => {
        
        const response = await tx.task.create({
            data: {
                title: parseData.data.title ?? DEFALUT_TITLE, 
                amount: 1 * TOTAL_DECIMALS,
                signature: parseData.data.signature,
                user_id: userId,
            }
        })

        await tx.option.createMany({
            data: parseData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        })
        return response;
    })

    res.json({
        id: response.id
    })
})

//Sign in with a wallet
//signing a messgae
router.post('/signin' , async(req,res) => {
    const hardcodedWalletAddress = "oKA6pV6MTDmmd1cQFKxpbvFrCurHSxM28agomEJyJWY";
    
    const existingUser = await prismaClient.user.findFirst({
        where:{
            address: hardcodedWalletAddress
        }
    })

    if(existingUser){
        const token = jwt.sign({
            userId: existingUser.id 
        },JWT_SECRET)

        res.json({
            token
        })
    }else{
        const user = await prismaClient.user.create({
            data:{
                address: hardcodedWalletAddress
            }
        })

        const token = jwt.sign({
            userId: user.id 
        },JWT_SECRET)

        res.json({
            token
        })
    }
});

export default router;