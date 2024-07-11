"use client"

import {TOTAL_DECIMALS } from '@/util';
import { useWallet } from '@solana/wallet-adapter-react';
import axios, { AxiosError } from 'axios';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ToastLTSBalance } from './Balance';
import { toast } from 'sonner';
const WalletButton = dynamic(() => import("./WalletButton"), { ssr: false });

export const Appbar = () => {

    const [loading , setLoading] = useState(false);
    const {publicKey, connected} = useWallet();
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_KEY;

    const pubKey = useMemo(() => {
        const walletAddress = publicKey?.toString();

        return walletAddress?.slice(0, 4) + ".." + walletAddress?.slice(-4);
    } , [publicKey]);

    return(<div className="flex justify-between border-b pb-2 pt-2">
    <div className="text-2xl pl-4 flex justify-center items-center pt-2">
        <Link href={"/"}>LabelMate Worker</Link>
    </div>

    <div className="text-xl pr-4 flex">
        <Link href={"/payout"} className="m-2 text-white bg-gray-800 hover:bg-gray-900 hover:underline focus:outline-none focus:ring-1 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
          My Payouts
        </Link>
        
        <button
          onClick={async () => {
            await ToastLTSBalance();
          }}
          className="m-2 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
        >
          Check Balance
        </button>

    {loading ? (
        <button
        disabled={loading}
        className="m-2 mr-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
        >
        Locking SOL...
      </button>
    ) : (
        <button
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            let tl;
            tl = toast.loading("Processing Payout...");
            const response = await axios.post(`${BACKEND_URL}/v1/worker/payout`,
                {},
                {
                  headers: {
                    Authorization: localStorage.getItem("token"),
                  },
                }
              ).catch((err) => {
                const data = (err as AxiosError).response?.data;
                toast.info((data as {message: string}).message);
                console.log(err);
              });

              if (response) {
                toast.dismiss(tl);
                toast.success(response.data.message);
                console.log(response.data);
              }
              toast.dismiss(tl);
              setLoading(false);

            }}

            className="m-2 mr-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
        >
            Pay me out
        </button>
    )}

        {connected && (
          <div className="m-2 text-white cursor-default bg-gray-800  focus:outline-none focus:ring-1 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800  dark:focus:ring-gray-700 dark:border-gray-700">
            {pubKey}
          </div>
        )}

        <WalletButton></WalletButton>
        </div>
    </div>
    );
};