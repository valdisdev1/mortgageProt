"use client";

import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export default function Home() {
  const { address } = useAccount();

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Real Estate Tokenization</span>
          <span className="block text-2xl mb-2">Transform your properties into digital assets</span>
        </h1>
        <div className="flex flex-col items-center gap-8 max-w-3xl text-center">
          {!address && (
            <div className="flex flex-col gap-2 items-center">
              <p className="text-lg">Connect your wallet to get started</p>
              <RainbowKitCustomConnectButton />
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Tokenize</h2>
                <p>Convert your real estate into NFTs with full property documentation</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Manage</h2>
                <p>Easily manage your tokenized properties in one place</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Trade</h2>
                <p>Future-ready for property trading and fractionalization</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
