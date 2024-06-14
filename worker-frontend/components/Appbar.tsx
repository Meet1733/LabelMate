"use client"

import { BACKEND_URL, TOTAL_DECIMALS } from '@/util';
import { useWallet } from '@solana/wallet-adapter-react';
import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import { headers } from 'next/headers';
import { useEffect, useState } from 'react';

export const Appbar = () => {
    const {publicKey, signMessage} = useWallet();
    const [balance , setBalance] = useState(0);

    async function signAndSend() {
        if(!publicKey){
            return;
        }

        const message = new TextEncoder().encode("Sign in to LabelMate as a worker")
        const signature = await signMessage?.(message);
        const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {
            signature,
            publicKey: publicKey?.toString()
        });

        localStorage.setItem("token" , response.data.token);
        setBalance(response.data.amount/ TOTAL_DECIMALS)

        
    }

    useEffect(() => {
        signAndSend()
    }, [publicKey])

    return <div className="flex justify-between border-b pb-2 pt-2 items-center">
    <div className="text-2xl pl-4 flex justify-center">
        LabelMate Worker
    </div>
    <div className="text-xl pr-4 flex items-center">
        <button onClick={() => {
            axios.post(`${BACKEND_URL}/v1/worker/payout` ,{
                
            }, {
                headers: {
                    "Authorization": localStorage.getItem("token")
                }
            })
        }} 
        className="m-2 mr-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">Pay me out ({balance}) SOL</button>
        {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
    </div>
</div>
}