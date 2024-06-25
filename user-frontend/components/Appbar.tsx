"use client"

import { BACKEND_URL } from '@/util';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
const WalletButton = dynamic(() => import("./WalletButton"), { ssr: false });

export const Appbar = () => {
    const {publicKey, signMessage} = useWallet();

    async function signAndSend() {
        if(!publicKey || !signMessage || !window){
            return;
        }

        if (window.localStorage.getItem("token")) {
            return;
        }

        const message = new TextEncoder().encode("Sign in to LabelMate")
        const signature = await signMessage?.(message);
        const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
            signature,
            publicKey: publicKey?.toString()
        });

        localStorage.setItem("token" , response.data.token);
    }

    useEffect(() => {
        signAndSend()
    }, [publicKey])

    return <div className="flex justify-between border-b pb-2 pt-2 items-center">
    <div className="text-2xl pl-4 flex justify-center">
        LabelMate
    </div>
    <div className="text-xl pr-4">
        <WalletButton publicKey={publicKey?.toString()}></WalletButton>
    </div>
</div>
}