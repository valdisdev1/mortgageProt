"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS, createAndUploadMetadata } from "~~/utils/ipfs";
import { notification } from "~~/utils/scaffold-eth";

export default function Home() {
  const { address } = useAccount();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    propertyAddress: "",
    bedrooms: "",
    bathrooms: "",
    appraisedValue: "",
    image: null as File | null,
    valuationDocument: null as File | null,
  });

  const { writeContractAsync, isMining } = useScaffoldWriteContract("RealEstateNFT");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === "file") {
      const files = e.target.files;
      setFormData(prev => ({
        ...prev,
        [name]: files?.[0] || null,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = "";
      let valuationUrl = "";

      if (formData.image) {
        imageUrl = await uploadToIPFS(formData.image);
        if (!imageUrl) {
          throw new Error("Failed to upload image");
        }
      }

      if (formData.valuationDocument) {
        valuationUrl = await uploadToIPFS(formData.valuationDocument);
        if (!valuationUrl) {
          throw new Error("Failed to upload valuation document");
        }
      }

      const metadataUrl = await createAndUploadMetadata(
        formData.propertyAddress,
        formData.bedrooms,
        formData.bathrooms,
        formData.appraisedValue,
        imageUrl,
        valuationUrl
      );

      if (!metadataUrl) {
        throw new Error("Failed to create metadata");
      }

      const metadataCid = metadataUrl.replace('https://ipfs.io/ipfs/', '').replace('/metadata.json', '');

      await writeContractAsync({
        functionName: "mintRealEstate",
        args: [
          formData.propertyAddress,
          BigInt(formData.bedrooms),
          BigInt(formData.bathrooms),
          BigInt(formData.appraisedValue),
          valuationUrl,
          metadataCid,
        ],
      });

      notification.success("Property tokenized successfully!");
      router.push("/properties");
    } catch (error) {
      console.error("Error creating property token:", error);
      notification.error(error instanceof Error ? error.message : "Failed to create property token");
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">Real Estate Tokenization</span>
            <span className="block text-2xl mb-2">Transform your properties into digital assets</span>
          </h1>
          <div className="flex flex-col items-center gap-8 max-w-3xl text-center">
            <div className="flex flex-col gap-2 items-center">
              <p className="text-lg">Connect your wallet to get started</p>
              <RainbowKitCustomConnectButton />
            </div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Create Property Token</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Property Address</label>
            <input
              type="text"
              name="propertyAddress"
              value={formData.propertyAddress}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Bedrooms</label>
              <input
                type="number"
                name="bedrooms"
                value={formData.bedrooms}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bathrooms</label>
              <input
                type="number"
                name="bathrooms"
                value={formData.bathrooms}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Appraised Value (USD)</label>
            <input
              type="number"
              name="appraisedValue"
              value={formData.appraisedValue}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Property Image (Optional)
              <span className="text-xs text-gray-500 ml-2">Will be displayed on the property card</span>
            </label>
            <input
              type="file"
              name="image"
              onChange={handleInputChange}
              accept="image/*"
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Valuation Document (Optional)
              <span className="text-xs text-gray-500 ml-2">PDF, DOC, or DOCX</span>
            </label>
            <input
              type="file"
              name="valuationDocument"
              onChange={handleInputChange}
              accept=".pdf,.doc,.docx"
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isMining}
            className={`w-full py-3 px-4 bg-primary text-primary-content rounded hover:bg-primary-focus ${
              isLoading || isMining ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading || isMining ? "Creating Token..." : "Create Property Token"}
          </button>
        </div>
      </form>
    </div>
  );
} 