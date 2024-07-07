import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, TOTAL_DECIMALS } from "../config";
import { authMiddleware } from "../middleware";
import { createTaskInput } from "../types";
import nacl from "tweetnacl";
import { PublicKey, Connection} from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

const PARENT_WALLET_ADDRESS = "5vkfyMDzi3GLxZxD5ZWvYP8hfAzsqzD2H6FVKdsy7SZy"; 

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

router.get('/task/all' , authMiddleware , async(req,res) => {
    // @ts-ignore
    const userId: string = req.userId;
    
    const tasks = await prismaClient.task.findMany({
        where: {
            user_id: Number(userId)
        },
        include: {options: true, submissions: {
            
            include:{ Option: true } }},
    })
    
    const tasksResult: {
        taskId: number;
        title: string;
        signature: string;
        done: boolean;
        options: Record<
            string,
            {
                count: number;
                imageUrl: string;
            }
        >;
    }[] = [];

    tasks.forEach((task) => {
        const taskOptions: Record <
            string,
            {
                count: number;
                imageUrl: string;
            }
        > = {};


        task.options.forEach((option) => {
            taskOptions[option.id] = {
                count: 0,
                imageUrl: option.image_url ?? "",
            }
        });

        const filteredTask = {
            taskId: task.id,
            done: task.done,
            signature: task.signature,
            title: task.title ?? "",
            options: taskOptions,
        };

        tasksResult.push(filteredTask),

        task.submissions.forEach((s) =>{
            filteredTask.options[s.option_id].count++;
        });
    });

    res.status(200).json(tasksResult);
})

router.get('/task' , authMiddleware ,  async (req,res) => {
    // @ts-ignore
    const taskId: string = req.query.taskId;

    //@ts-ignore
    const userId: string = req.userId;

    if (!taskId || !userId) {
        return res.status(411).json({ message: "Task Id is missing" });
    }

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

router.get("/me" , authMiddleware , async(req,res) => {
    // @ts-ignore
    const userId = req.userId; 

    const user = await prismaClient.user.findFirst({
        where: {
            id: Number(userId)
        }
    })

    if(!user) {
        return res.json({message: "User does not exist"});
    }

    return res.json(user);

})

router.post("/task" , authMiddleware , async (req,res) => {
    
    // @ts-ignore
    const userId = req.userId; 

    //validate inputs from user
    const body = req.body;

    const parseData = createTaskInput.safeParse(body);

    const user = await prismaClient.user.findFirst({
        where: {
            id: userId
        }
    })

    if(!parseData.success){
        return res.status(411).json({
            message: "You've sent the wrong inputs"
        })
    }

    //parse the signature here to ensure the person has paid $50
    const transaction = await connection.getTransaction(parseData.data.signature , {
        maxSupportedTransactionVersion: 1
    });

    if (!transaction || !transaction.meta) {
        return res.status(404).json({ message: "Transaction not found." });
    }

    if((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        })
    }

    if(transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        })
    }

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
router.post('/signin' , async(req,res) => {
    const {publicKey , signature} = req.body;
    const message = new TextEncoder().encode("Sign in to LabelMate");

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

    const existingUser = await prismaClient.user.findFirst({
        where:{
            address: publicKey
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
                address: publicKey
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