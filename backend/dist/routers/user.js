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
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const middleware_1 = require("../middleware");
const types_1 = require("../types");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const connection = new web3_js_1.Connection("https://api.devnet.solana.com");
const PARENT_WALLET_ADDRESS = "5vkfyMDzi3GLxZxD5ZWvYP8hfAzsqzD2H6FVKdsy7SZy";
const DEFALUT_TITLE = "Select the most clickable thumbnail";
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
prismaClient.$transaction((prisma) => __awaiter(void 0, void 0, void 0, function* () {
    // Code running in a transaction...
}), {
    maxWait: 5000, // default: 2000
    timeout: 10000, // default: 5000
});
router.get('/task/all', middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const tasks = yield prismaClient.task.findMany({
        where: {
            user_id: Number(userId)
        },
        include: { options: true, submissions: {
                include: { Option: true }
            } },
    });
    const tasksResult = [];
    tasks.forEach((task) => {
        var _a;
        const taskOptions = {};
        task.options.forEach((option) => {
            var _a;
            taskOptions[option.id] = {
                count: 0,
                imageUrl: (_a = option.image_url) !== null && _a !== void 0 ? _a : "",
            };
        });
        const filteredTask = {
            taskId: task.id,
            done: task.done,
            signature: task.signature,
            title: (_a = task.title) !== null && _a !== void 0 ? _a : "",
            options: taskOptions,
        };
        tasksResult.push(filteredTask),
            task.submissions.forEach((s) => {
                filteredTask.options[s.option_id].count++;
            });
    });
    res.status(200).json(tasksResult);
}));
router.get('/task', middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const taskId = req.query.taskId;
    //@ts-ignore
    const userId = req.userId;
    if (!taskId || !userId) {
        return res.status(411).json({ message: "Task Id is missing" });
    }
    const taskDetails = yield prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    });
    if (!taskDetails) {
        return res.status(411).json({
            message: "You don't have access to this task"
        });
    }
    const respnoses = yield prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId)
        },
        include: {
            Option: true
        }
    });
    const result = {};
    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                // @ts-ignore
                imageUrl: option.image_url
            }
        };
    });
    respnoses.forEach(r => {
        result[r.option_id].count++;
    });
    res.json({
        result,
        taskDetails
    });
}));
router.get("/me", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const user = yield prismaClient.user.findFirst({
        where: {
            id: Number(userId)
        }
    });
    if (!user) {
        return res.json({ message: "User does not exist" });
    }
    return res.json(user);
}));
router.post("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    // @ts-ignore
    const userId = req.userId;
    //validate inputs from user
    const body = req.body;
    const parseData = types_1.createTaskInput.safeParse(body);
    const user = yield prismaClient.user.findFirst({
        where: {
            id: userId
        }
    });
    if (!parseData.success) {
        return res.status(411).json({
            message: "You've sent the wrong inputs"
        });
    }
    //parse the signature here to ensure the person has paid $50
    const transaction = yield connection.getTransaction(parseData.data.signature, {
        maxSupportedTransactionVersion: 1
    });
    if (!transaction || !transaction.meta) {
        return res.status(404).json({ message: "Transaction not found." });
    }
    if (((_b = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _a === void 0 ? void 0 : _a.postBalances[1]) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _c === void 0 ? void 0 : _c.preBalances[1]) !== null && _d !== void 0 ? _d : 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        });
    }
    if (((_e = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _e === void 0 ? void 0 : _e.toString()) !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        });
    }
    if (((_f = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(0)) === null || _f === void 0 ? void 0 : _f.toString()) !== (user === null || user === void 0 ? void 0 : user.address)) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        });
    }
    let response = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        const response = yield tx.task.create({
            data: {
                title: (_g = parseData.data.title) !== null && _g !== void 0 ? _g : DEFALUT_TITLE,
                amount: 1 * config_1.TOTAL_DECIMALS,
                signature: parseData.data.signature,
                user_id: userId,
            }
        });
        yield tx.option.createMany({
            data: parseData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        });
        return response;
    }));
    res.json({
        id: response.id
    });
}));
//Sign in with a wallet
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign in to LabelMate");
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(signature.data), new web3_js_1.PublicKey(publicKey).toBytes());
    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        });
    }
    const existingUser = yield prismaClient.user.findFirst({
        where: {
            address: publicKey
        }
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, config_1.JWT_SECRET);
        res.json({
            token
        });
    }
    else {
        const user = yield prismaClient.user.create({
            data: {
                address: publicKey
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, config_1.JWT_SECRET);
        res.json({
            token
        });
    }
}));
exports.default = router;
