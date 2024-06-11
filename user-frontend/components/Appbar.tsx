"use client"

import { BACKEND_URL } from '@/util';
import { useWallet } from '@solana/wallet-adapter-react';
import {
    WalletDisconnectButton,
    WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import { useEffect } from 'react';

export const Appbar = () => {
    const {publicKey, signMessage} = useWallet();

    async function signAndSend() {
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
        {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
    </div>
</div>
}