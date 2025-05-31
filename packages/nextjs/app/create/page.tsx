"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS } from "~~/utils/ipfs";
import { notification } from "~~/utils/scaffold-eth";

export default function CreatePage() {
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
      let imageHash = "";
      let valuationHash = "";

      if (formData.image) {
        imageHash = await uploadToIPFS(formData.image);
      }

      if (formData.valuationDocument) {
        valuationHash = await uploadToIPFS(formData.valuationDocument);
      }

      await writeContractAsync({
        functionName: "mintRealEstate",
        args: [
          formData.propertyAddress,
          BigInt(formData.bedrooms),
          BigInt(formData.bathrooms),
          BigInt(formData.appraisedValue),
          valuationHash,
          imageHash,
        ],
      });

      notification.success("Property tokenized successfully!");
      router.push("/properties");
    } catch (error) {
      console.error("Error creating property token:", error);
      notification.error("Failed to create property token");
    } finally {
      setIsLoading(false);
    }
  };

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
