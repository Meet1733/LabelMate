"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = __importDefault(require("./routers/user"));
const worker_1 = __importDefault(require("./routers/worker"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
//built-in middleware function in Express. 
//It parses incoming requests with JSON payloads and is based on body-parser
app.use((0, cors_1.default)());
app.use("/v1/user", user_1.default);
app.use("/v1/worker", worker_1.default);
app.listen(5000, () => {
    console.log("Running at 5000");
});
