"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react"
import { UploadImage } from "./UploadImage";
import {PublicKey, SystemProgram , Transaction } from "@solana/web3.js";
import { useConnection} from "@solana/wallet-adapter-react";
import { WalletAdapterProps } from "@solana/wallet-adapter-base";
import { toast } from "sonner";

export const Upload = ({
    publicKey,
    sendTransaction,
}: {
    publicKey: PublicKey | null;
    sendTransaction: WalletAdapterProps["sendTransaction"];
}) => {
    const [images, setImages] = useState<string[]>([]);
    const [title, setTitle] = useState<string | null>(null);
    const [txSignature , setTxSignature] = useState("");
    const {connection} = useConnection();
    const [loading, setLoading] = useState(false);
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_KEY;

    const router = useRouter();

    async function onSubmit() {
        if(!txSignature){
            console.log("Signature not found");
            return;
        }
        setLoading(true);
        const tl = toast.loading("Submiting task to workers");

        try{
            const response = await axios.post(`${BACKEND_URL}/v1/user/task` , {
                options: images.map(image => ({
                    imageUrl: image,
                })),
                title,
                signature: txSignature
            }, {
                headers: {
                    "Authorization": localStorage.getItem("token")
                }
            })
            
            toast.dismiss(tl);
            toast.success("Successfully submitted the task", { description: `TASK ID: ${response.data.id}`,
            });
            router.push(`/task/${response.data.id}`)
        }catch(e){
            toast.dismiss(tl);
            toast.error((e as Error).message);
            console.log(e);
        }
        setLoading(false);
    }

    async function makePayment() {

        if(!publicKey || !sendTransaction){
            return;
        }

        setLoading(true);
        let tl;

        try{
            if(!title){
                throw new Error("Add Title");
            }

            if(images.length < 2){
                throw new Error("Upload Minimum Two Images");
            }

            tl = toast.loading("Making Payment...");
            
            const walletAddress = process.env.NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS;
            if (!walletAddress) {
                throw new Error('NEXT_PUBLIC_PAYMENT_WALLET_ADDRESS is not defined in the environment variables.');
            }
            
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey!,
                    toPubkey: new PublicKey(walletAddress),
                    lamports: 100000000, //0.1 SOL
                })
            );

            const {
                context: {slot: minContextSlot },
                value: {blockhash, lastValidBlockHeight }
            } = await connection.getLatestBlockhashAndContext();
    
            const signature = await sendTransaction(transaction , connection, {minContextSlot});
    
            await connection.confirmTransaction({ blockhash , lastValidBlockHeight , signature});
            setTxSignature(signature);
            toast.dismiss(tl);
            toast.success("Payment Successfull. Please submit the task.")
        } catch(e){
            toast.dismiss(tl);
            toast.error((e as Error).message);
            console.log(e);
        }
        setLoading(false);
    }

    return <div className="flex justify-center">
    <div className="max-w-screen-lg w-full">
        <div className="text-2xl text-left pt-20 w-full pl-4">
            Create a task
        </div>

        <label className="pl-4 block mt-2 text-md font-medium text-gray-900">Task details</label>

        <input onChange={(e) => {
            setTitle(e.target.value);
        }} type="text" id="first_name" className="ml-4 mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="What is your task?" required />

        <label className="pl-4 block mt-8 text-md font-medium text-gray-900">Add Images</label>
        <div className="flex justify-center pt-4 max-w-screen-lg">
            {images.map(image => <UploadImage image={image} onImageAdded={(imageUrl) => {
                setImages(i => [...i, imageUrl]);
            }} />)}
        </div>

    <div className="ml-4 pt-2 flex justify-center">
        <UploadImage onImageAdded={(imageUrl) => {
            setImages(i => [...i, imageUrl]);
        }} />
    </div>

    <div className="flex justify-center">
        {loading ? (
            <button
              disabled={true}
              type="button"
              className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
            >
              {"Loading..."}
            </button>
          ) : txSignature ? (
            <button
              onClick={onSubmit}
              type="button"
              disabled={loading}
              className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
            >
              {loading ? "Sumbiting..." : "Submit Task"}
            </button>
          ) : (
            <button
              onClick={makePayment}
              type="button"
              className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full  text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
            >
              {"Submit Task for 0.1 sol"}
            </button>
          )}
    </div>
    
  </div>
</div>
}