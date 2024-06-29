"use client"

import { Appbar } from "@/components/Appbar";
import { Hero } from "@/components/Hero";
import { Upload } from "@/components/Upload";
import { useWalletSession } from "@/components/Auth";

export default function Home() {
  const {publicKey , sendTransaction} = useWalletSession();
  return (
    <main>
      <Appbar/>
      <Hero/>
      <Upload publicKey={publicKey} sendTransaction={sendTransaction}/>   
    </main>
  )
}
