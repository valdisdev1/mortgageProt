'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useScaffoldContract } from '~~/hooks/scaffold-eth';

interface PropertyData {
  propertyAddress: string;
  bedrooms: bigint;
  bathrooms: bigint;
  appraisedValue: bigint;
  valuationDocumentHash: string;
  imageHash: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [totalSupply, setTotalSupply] = useState<string>("0");

  const { data: contract } = useScaffoldContract({
    contractName: "RealEstateNFT",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (contract) {
        try {
          const supply = await contract.read.tokenIdCounter();
          setTotalSupply(supply.toString());

          const props = await contract.read.getAllProperties();
          setProperties(props as PropertyData[]);
        } catch (error) {
          console.error("Error fetching properties:", error);
        }
      }
    };
    fetchData();
  }, [contract]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Properties ({totalSupply})</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property, index) => (
          <div key={index} className="bg-base-100 shadow-xl rounded-lg overflow-hidden">
            {property.imageHash ? (
              <div className="relative h-48 w-full">
                <Image
                  src={`https://ipfs.io/ipfs/${property.imageHash}`}
                  alt={`Property at ${property.propertyAddress}`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{property.propertyAddress}</h2>
              <div className="flex justify-between mb-2">
                <span>{property.bedrooms.toString()} beds</span>
                <span>{property.bathrooms.toString()} baths</span>
              </div>
              <div className="text-lg font-bold">
                ${Number(property.appraisedValue).toLocaleString()}
              </div>
              {property.valuationDocumentHash && (
                <a
                  href={`https://ipfs.io/ipfs/${property.valuationDocumentHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-focus text-sm mt-2 block"
                >
                  View Valuation Document
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 