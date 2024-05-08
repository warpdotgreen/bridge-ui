"use client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import ChiaWalletButtons from "../ChiaWalletButtons"
import { Button } from "@/components/ui/button"
import { useWallet } from "../ChiaWalletManager/WalletContext"
import Image from "next/image"

function WalletModal() {
  const { walletConnected, address } = useWallet()
  const buttonTrigger = !walletConnected
    ?
    <Button variant="outline" className="shadow-sm shadow-green-300 grayscale">Connect Wallet</Button>
    :
    <Button variant="outline" className="group flex gap-2 shadow-sm ">
      <Image className='group-hover:opacity-80 w-6 h-auto p-1 shadow-sm shadow-white/50 border rounded-full aspect-square bg-accent object-contain' src="/icons/chia-icon.svg" width={40} height={40} alt={`Chia wallet icon`} priority />
      {!!address ? `${address.slice(0, 5)}...${address.slice(-3)}` : 'Manage Wallet'}
    </Button>

  return (
    <Dialog>
      <DialogTrigger asChild>
        {buttonTrigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">Wallets</DialogTitle>
          <DialogDescription className="sr-only">
            Connect a wallet for Chia & Ethereum chains
          </DialogDescription>
        </DialogHeader>

        <p className="-mb-1 font-extralight text-xl">Connect Chia Wallet</p>
        <ChiaWalletButtons />

      </DialogContent>
    </Dialog>

  )
}

export default WalletModal