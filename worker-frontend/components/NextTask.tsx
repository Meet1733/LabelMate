"use client"

import { BACKEND_URL } from "@/util";
import axios from "axios";
import { useEffect, useState } from "react"
import { toast } from "sonner";

interface Task{
    "id": number,
    "amount": number,
    "title": string,
    "options": {
        id: number,
        image_url: string,
        task_id: number
    }[]
}

export const NextTask = () =>{

    const [currentTask , setCurrentTask] = useState<Task | null>(null);
    const [loading , setLoading] = useState(true);
    const [getTask , setGetTask] = useState(false);

    useEffect(() => {
        axios.get(`${BACKEND_URL}/v1/worker/nextTask` , {
            headers: {
                "Authorization": localStorage.getItem('token')
            }
        })
            .then(res => {
                setCurrentTask(res.data.task)
            }) 
            .catch(e => {
                setCurrentTask(null)
            })
        setLoading(false);
    },[])

    if(loading){
        return <div className=" h-screen flex items-center justify-center text-2xl">
                Loading...
            </div>
    }
    
    if(getTask){
        return <div className=" h-screen flex items-center justify-center text-2xl">
            Hang tight! We're loading new tasks for you...
    </div>
    }

    if(!currentTask){
        return <div className=" h-screen flex items-center justify-center text-2xl">
                Please check back in some time, there are no pending tasks at the moment.
        </div>
    }

    return <div>
        <div className="text-2xl pt-20 flex justify-center">
            {currentTask.title} {currentTask.id}
        </div>

        <div className="flex justify-center pt-8">
            {currentTask.options.map(option => <Option onSelect={async () => {
                setGetTask(true);
                let tl;
                try {
                    tl = toast.loading("Submitting Task...");

                    const response = await axios.post(`${BACKEND_URL}/v1/worker/submission`, {
                        taskId: currentTask.id.toString(),
                        selection: option.id.toString()
                    }, {
                        headers: {
                            "Authorization": localStorage.getItem("token")
                        }
                    });
    
                    const nextTask = response.data.nextTask;
                    if(nextTask){
                        setCurrentTask(nextTask);
                    }else{
                        setCurrentTask(null);
                    }
                    toast.dismiss(tl);
                    toast.success("Task Submitted.");
                } catch (e) {
                    toast.dismiss(tl);
                    toast.error((e as Error).message);
                    console.log(e);
                }
                setGetTask(false);
            }} key={option.id} imageUrl={option.image_url} />)}
        </div>
    </div>
}

function Option({imageUrl, onSelect}: {
    imageUrl: string,
    onSelect: () => void;
}){
    return <div>
        <img onClick={onSelect} className="pt-2 mx-3 w-80 h-80 cursor-pointer hover:scale-105" src={imageUrl}/>
    </div>
}