"use client"
import "../globals.css";

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { Appbar } from "@/components/Appbar";

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const network = WalletAdapterNetwork.Devnet;
  
    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [],
        [network]
    );

  return (
    <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                    <Appbar/>
                    {children}
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
  );
}
