"use client";
import { BRIDGING_FEE_MOJOS, burnCATs, getBurnSendAddress, getBurnSendFullPuzzleHash, getCATBurnerPuzzle, sbToString } from "@/util/driver";
import { getCoinRecordByName, getCoinRecordsByPuzzleHash, getPuzzleAndSolution, pushTx } from "@/util/rpc";
import { ethers } from "ethers";
import { useState } from "react";
import * as GreenWeb from 'greenwebjs';
import Link from "next/link";
import { initializeBLS } from "clvm";
import { BRIDGE_CONTRACT_ADDRESS } from "@/util/bridge";
import { decodeSignature, getSig } from "@/util/sig";

export const PORTAL_ADDRESS = process.env.NEXT_PUBLIC_PORTAL_ADDRESS!; 

export default function FromChia() {
  const [ethAddress, setEthAddress] = useState("0x113f132a978B7679Aa72c02B0234a32569507043");
  const [ethTokenAddress, setEthTokenAddress] = useState("0xC5005B90b825d521129d386e32B81cB77fD70652");
  const [tokenAmountStr, setTokenAmounStr] = useState("31.337");
  const [tokenWalletId, setTokenWalletId] = useState("3");
  const [blsInitialized, setBlsInitialized] = useState(false);
  const [offer, setOffer] = useState("");
  const [sb, setSb] = useState({});
  const [nonce, setNonce] = useState("");
  const [pushTxStatus, setPushTxStatus] = useState("push tx response will be here");
  const [sig, setSig] = useState("");

  const offerAmount = BRIDGING_FEE_MOJOS - Math.ceil(parseFloat(tokenAmountStr) * 1000);

  const createSpendBundle = async () => {
    // const puzzleHash = getBurnSendFullPuzzleHash(
    //   "657468", // eth
    //   process.env.NEXT_PUBLIC_BRIDGE_ADDRESS!.slice(2),
    //   ethTokenAddress,
    //   ethAddress
    // );

    // const coinRecords = await getCoinRecordsByPuzzleHash(puzzleHash);
    // if(coinRecords.length > 1) {
    //   alert("Multiple records found, using first one - make sure ammount is correct.")
    // }
    // const coinRecord = coinRecords[0];

    // const burnSendCoinParent = coinRecord.coin.parent_coin_info;

    // const burnSendCoinParentRecord = await getCoinRecordByName(burnSendCoinParent);
    // const burnSendCoinParentSpend = await getPuzzleAndSolution(
    //   burnSendCoinParent, burnSendCoinParentRecord.spent_block_index
    // );

    const [sb, nonce] = await burnCATs(
      offer,
      "657468", // eth
      ethTokenAddress,
      ethAddress
    );

    setSb(sb);
    setNonce(nonce);
  }

  const claimOnEthSide = async () => {
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(PORTAL_ADDRESS, [
      "function receiveMessage(bytes32 _nonce, bytes3 _source_chain, bytes32 _source, address _destination, bytes32[] memory _contents, bytes memory sigs) external"
    ], signer);

    const [
      origin_chain,
      destination_chain,
      nonce,
      _, // coin_id = ""
      realSig
    ]= decodeSignature(sig);

    const sourcePuzzle = getCATBurnerPuzzle(
      process.env.NEXT_PUBLIC_BRIDGING_PUZZLE_HASH!,
      destination_chain,
      BRIDGE_CONTRACT_ADDRESS.slice(2)
    );
    const sourcePuzzleHash = GreenWeb.util.sexp.sha256tree(sourcePuzzle);
    console.log({ sourcePuzzleHash });

    let assetContract = ethTokenAddress.slice(2);
    assetContract = "0x" + assetContract.padStart(64, "0");
    let receiver = ethAddress.slice(2);
    receiver = "0x" + receiver.padStart(64, "0");
    const tx = await contract.receiveMessage(
      "0x" + nonce,
      "0x" + origin_chain,
      "0x" + sourcePuzzleHash,
      BRIDGE_CONTRACT_ADDRESS,
      [
        assetContract, // asset
        receiver, // receiver
        ethers.toBeHex(Math.ceil(parseFloat(tokenAmountStr) * 1000), 32) // amount
      ],
      "0x" + realSig
    );
    await tx.wait();

    alert('done! check wallet :)');
  }

  const getValidatorSig = async () => {
    const sig = await getSig(
      "786368", // xch 
      "657468", // eth
      nonce,
      null
    );
    setSig(sig);
  }

  return (
    <main className="flex min-h-screen flex-col items-center pr-48 pl-48 pt-16 pb-8">
      <div className="flex flex-col space-y-4 w-full pb-16">
        <p className="text-blue-600 underline left">
          <Link href="/">Back</Link>
        </p>
        <div className="flex flex-col space-y-4 w-full pb-16">
          <label className="text-lg font-semibold">1. Initialize BLS Module</label>
          <p>BLS Initialized: {blsInitialized ? 'Yes' : 'No'}</p>
          <button
            className="px-6 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            onClick={async () => {
              await initializeBLS();
              setBlsInitialized(true);
            }}
          >Initialize BLS</button>
        </div>
        <label className="text-lg font-semibold">2. Create offer</label>
        <p>ETH Address:</p>
        <input
          type="text"
          value={ethAddress}
          onChange={(e) => setEthAddress(e.target.value)}
          placeholder="ETH Address"
          className="w-full p-4 text-lg border-2 border-gray-300 rounded-md"
        />
        <p>Token Contract Address on ETH (e.g., WETH Address):</p>
        <input
          type="text"
          value={ethTokenAddress}
          onChange={(e) => setEthTokenAddress(e.target.value)}
          placeholder="ETH Token Contract Address"
          className="w-full p-4 text-lg border-2 border-gray-300 rounded-md"
        />
        <p>Token Amount:</p>
        <input
          type="text"
          value={tokenAmountStr}
          onChange={(e) => setTokenAmounStr(e.target.value)}
          placeholder="Token Amount"
          className="w-full p-4 text-lg border-2 border-gray-300 rounded-md"
        />
        <p>Token Wallet id:</p>
        <input
          type="text"
          value={tokenWalletId}
          onChange={(e) => setTokenWalletId(e.target.value)}
          placeholder="Token Wallet Id"
          className="w-full p-4 text-lg border-2 border-gray-300 rounded-md"
        />
        <p>chia rpc wallet create_offer_for_ids {"'"}{'{"offer":{"1":-' + (offerAmount).toString() + ',"' + tokenWalletId + '":-' + (ethers.parseUnits(tokenAmountStr, 3)).toString() + '},"fee":4200000000,"driver_dict":{},"validate_only":false}'}{"'"}</p>
        <input
          type="text"
          value={offer}
          onChange={(e) => setOffer(e.target.value)}
          placeholder="offer1..."
          className="w-full p-4 text-lg border-2 border-gray-300 rounded-md"
        />
        <button
          type="submit"
          className="px-6 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          onClick={createSpendBundle}
        >Create Spend Bundle</button>
      </div>
      <div className="flex flex-col space-y-4 w-full pb-16">
        <label className="text-lg font-semibold">4. Broadcast Spendbundle</label>
        <p>SpendBundle available: {JSON.stringify(sb).length == 2 ? 'No' : 'Yes'}</p>
        <button
          type="submit"
          className="px-6 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          disabled={JSON.stringify(sb).length == 2}
          onClick={() => {
            navigator.clipboard.writeText(sbToString(sb));
            alert('SpendBundle copied to clipboard!');
          }}
        >Copy SpendBundle to Clipboard</button>
        <textarea disabled={true} value={pushTxStatus} rows={(pushTxStatus.match(/\n/g) || []).length + 1} />
        <button
          type="submit"
          className="px-6 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          onClick={async () => {
            const res = await pushTx(sb);
            setPushTxStatus(JSON.stringify(res, null, 2));
          }}
          disabled={JSON.stringify(sb).length == 2}
        >Push Tx</button>
      </div>
      <div className="flex flex-col space-y-4 w-full pb-16">
        <label className="text-lg font-semibold">5. Get signature, call ETH contract</label>
        <p>Nonce: {nonce}</p>
        <p>Signature: </p>
        <input
          type="text"
          value={sig}
          onChange={(e) => setSig(e.target.value)}
          placeholder="Signature"
          className="w-full p-4 text-lg border-2 border-gray-300 rounded-md"
        />
        <button
          className="px-6 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          onClick={getValidatorSig}
        >Get Signature via Nostr</button>
        <button
          className="px-6 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          onClick={claimOnEthSide}
        >Execute Claim Tx via M*tamask</button>
      </div>
    </main>
  );
}
