"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const express_1 = require("express");
const middleware_1 = require("../middleware");
const db_1 = require("../db");
const types_1 = require("../types");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = require("bs58");
require('dotenv').config();
const connection = new web3_js_1.Connection("https://api.devnet.solana.com");
const TOTAL_SUBMISSION = 100;
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
prismaClient.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
    // Code running in a transaction...
}), {
    maxWait: 5000, // default: 2000
    timeout: 10000, // default: 5000
});
router.post("/payout", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    try {
        const worker = yield prismaClient.worker.findUnique({
            where: {
                id: Number(userId)
            }
        });
        if (!worker) {
            throw new Error("Worker not found");
        }
        if (worker.pending_amount < 30000000) {
            throw new Error("Your need to have atleast 0.03 sol as pending amount to withdraw.");
        }
        const walletAddress = process.env.PAYMENT_WALLET_ADDRESS;
        if (!walletAddress) {
            throw new Error('PAYMENT_WALLET_ADDRESS is not defined in the environment variables.');
        }
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: new web3_js_1.PublicKey(walletAddress),
            toPubkey: new web3_js_1.PublicKey(worker.address),
            lamports: 1000000000 * worker.pending_amount / config_1.TOTAL_DECIMALS, //1 SOL = 1e9 Lamports
        }));
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('PRIVATE_KEY is not defined in the environment variables.');
        }
        const keypair = web3_js_1.Keypair.fromSecretKey((0, bs58_1.decode)(privateKey));
        let signature = "";
        try {
            signature = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [keypair]);
        }
        catch (e) {
            return res.json({
                message: "Transaction failed"
            });
        }
        //Should Add a lock here to avoid double spending
        yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.worker.update({
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
            });
            yield tx.payouts.create({
                data: {
                    worker_id: Number(userId),
                    amount: worker.pending_amount,
                    status: "Success",
                    signature: signature
                }
            });
        }));
        return res.status(200).json({
            message: `Your pending amount of ${worker.pending_amount / config_1.TOTAL_DECIMALS} SOL is locked and is getting processed.`,
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
}));
router.get("/payout", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const payouts = yield prismaClient.payouts.findMany({
        where: {
            worker_id: Number(userId)
        }
    });
    return res.json(payouts);
}));
router.get("/balance", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const worker = yield prismaClient.worker.findFirst({
        where: {
            id: Number(userId)
        }
    });
    res.json({
        pendingAmount: worker === null || worker === void 0 ? void 0 : worker.pending_amount,
        lockedAmount: worker === null || worker === void 0 ? void 0 : worker.locked_amount
    });
}));
router.post("/submission", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = types_1.createSubmissionInput.safeParse(body);
    if (parsedBody.success) {
        const task = yield (0, db_1.getNextTask)(Number(userId));
        if (!task || task.id !== Number(parsedBody.data.taskId)) {
            return res.status(411).json({
                message: "Incorrect task id"
            });
        }
        const amount = (Number(task.amount) / TOTAL_SUBMISSION).toString();
        const submission = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const submission = yield tx.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    worker_id: userId,
                    task_id: Number(parsedBody.data.taskId),
                    amount: Number(amount)
                }
            });
            yield prismaClient.worker.update({
                where: {
                    id: userId,
                },
                data: {
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            });
            return submission;
        }));
        const nextTask = yield (0, db_1.getNextTask)(Number(userId));
        res.json({
            nextTask,
            amount
        });
    }
    else {
        res.status(411).json({
            message: "Incorrect inputs"
        });
    }
}));
router.get("/nextTask", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    try {
        const task = yield (0, db_1.getNextTask)(Number(userId));
        if (!task) {
            res.status(411).json({
                message: "No more tasks left for you to review"
            });
        }
        else {
            res.json({
                task
            });
        }
    }
    catch (e) {
        return res.status(500).json({
            message: "INTERNAL_SERVER_ERROR",
            description: e.message,
        });
    }
}));
router.get('/me', middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const workerId = req.userId;
    const existingUser = yield prismaClient.worker.findFirst({
        where: {
            id: Number(workerId),
        }
    });
    if (!existingUser) {
        return res.status(404).json({
            message: "Worker not found"
        });
    }
    const payouts = yield prismaClient.payouts.findMany({
        where: {
            worker_id: Number(workerId),
        }
    });
    let totalEarnings = 0;
    payouts.forEach((payout) => {
        totalEarnings += payout.amount;
    });
    res.json(Object.assign(Object.assign({}, existingUser), { locked: existingUser.locked_amount / config_1.TOTAL_DECIMALS, amount: existingUser.pending_amount / config_1.TOTAL_DECIMALS, earning: totalEarnings / config_1.TOTAL_DECIMALS }));
}));
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign in to LabelMate as a worker");
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(signature.data), new web3_js_1.PublicKey(publicKey).toBytes());
    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        });
    }
    const existingUser = yield prismaClient.worker.findFirst({
        where: {
            address: publicKey
        }
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, config_1.WORKER_JWT_SECRET);
        res.json({
            token,
            amount: existingUser.pending_amount
        });
    }
    else {
        const user = yield prismaClient.worker.create({
            data: {
                address: publicKey,
                pending_amount: 0,
                locked_amount: 0
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, config_1.WORKER_JWT_SECRET);
        res.json({
            token,
            amount: 0
        });
    }
}));
exports.default = router;
