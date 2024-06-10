import express from "express";
import userRouter from './routers/user';
import workerRouter from './routers/worker';
import cors from "cors";
const app = express();

app.use(express.json()); 
//built-in middleware function in Express. 
//It parses incoming requests with JSON payloads and is based on body-parser
app.use(cors())

app.use("/v1/user" , userRouter)
app.use("/v1/worker" , workerRouter)

app.listen(5000 , () => {
    console.log("Running at 5000")
})