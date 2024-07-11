import { useWallet } from "@solana/wallet-adapter-react";
import axios,  { AxiosError } from "axios";
import { useEffect } from "react";
import { toast } from "sonner";

export function useWalletSession() {
    const wallet = useWallet();

    useEffect(() => {
        if(!wallet.publicKey || !wallet.signMessage){
            return;
        }
        console.log(wallet.signMessage);
        handleAuth(wallet.publicKey.toString() , wallet.signMessage);
    }, [wallet.publicKey]);
    return wallet;
}

function handleAuth(
    publicKey: string,
    signMessage: (message: Uint8Array) => 
        Promise<Uint8Array>
)   {
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_KEY;
    axios.get(`${BACKEND_URL}/v1/worker/me` , {
        headers: {
            Authorization:localStorage.getItem("token"),
        }
    }).catch(async (err) => {
        toast("You are not authenticated as a worker, please log in.");
        if(err instanceof AxiosError && err.response?.status == 403){
            const message = new TextEncoder().encode("Sign in to LabelMate as a worker")
            const signature = await signMessage?.(message);

            const response = await axios.post(`${BACKEND_URL}/v1/worker/signin`, {
                signature: signature,
                publicKey: publicKey?.toString()
            });

            localStorage.setItem("token" , response.data.token);
            toast.success("Logged In");
        } else{
            console.log(err);
            toast.error((err as Error).message);
            return;
        }
    })
}