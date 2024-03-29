"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center pr-48 pl-48 pt-16 pb-8">
      <div className="flex flex-col space-y-4 w-full pb-16">
        <h1 className="text-xl font-bold">Choose your destination:</h1>
        <p className="text-blue-600 underline">
          <Link href="/to-chia">Bridge TO Chia</Link>
        </p>
        <p className="text-blue-600 underline">
          <Link href="/from-chia">Bridge FROM Chia</Link>
        </p>
        <p className="text-blue-600 underline">
          <Link href="/ui">UI (WIP)</Link>
        </p>
      </div>
    </main>
  );
}
