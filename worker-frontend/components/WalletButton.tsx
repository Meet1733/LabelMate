import {
    WalletDisconnectButton,
    WalletMultiButton,
  } from "@solana/wallet-adapter-react-ui";
import React from "react";
import { toast } from "sonner";
import { useWalletSession } from "./Auth";
  
  export default function WalletButton() {
    const { publicKey } = useWalletSession();

    return (
      <>
        {publicKey ? (
          <WalletDisconnectButton
            onClick={() => {
              window.localStorage.removeItem("token");
              toast("You are logged out.");
            }}
          />
        ) : (
          <WalletMultiButton />
        )}
      </>
    );
  }