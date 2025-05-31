'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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

function arePropertiesEqual(prev: PropertyData[], next: PropertyData[]): boolean {
  if (prev.length !== next.length) return false;
  return prev.every((prop, index) => {
    const nextProp = next[index];
    return (
      prop.propertyAddress === nextProp.propertyAddress &&
      prop.bedrooms === nextProp.bedrooms &&
      prop.bathrooms === nextProp.bathrooms &&
      prop.appraisedValue === nextProp.appraisedValue &&
      prop.valuationDocumentHash === nextProp.valuationDocumentHash &&
      prop.imageHash === nextProp.imageHash
    );
  });
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [totalSupply, setTotalSupply] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchTime = useRef<number>(0);
  const isInitialMount = useRef(true);

  const { data: contract } = useScaffoldContract({
    contractName: "RealEstateNFT",
  });

  const fetchData = useCallback(async (force = false) => {
    if (!contract) {
      console.log("Skipping fetch: No contract available");
      return;
    }
    
    if (isLoading) {
      console.log("Skipping fetch: Already loading");
      return;
    }

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    
    if (!force && timeSinceLastFetch < 4900) {
      console.log(`Skipping fetch: Too soon (${timeSinceLastFetch}ms since last fetch)`);
      return;
    }

    console.log(`Fetching data... (force: ${force}, timeSinceLastFetch: ${timeSinceLastFetch}ms)`);
    setIsLoading(true);
    lastFetchTime.current = now;

    try {
      const [supply, props] = await Promise.all([
        contract.read.tokenIdCounter(),
        contract.read.getAllProperties()
      ]);
      
      const supplyStr = supply.toString();
      
      // Only update state if data has changed
      if (supplyStr !== totalSupply) {
        console.log("Updating total supply:", supplyStr);
        setTotalSupply(supplyStr);
      }
      
      if (!arePropertiesEqual(properties, props as PropertyData[])) {
        console.log("Updating properties");
        setProperties(props as PropertyData[]);
      } else {
        console.log("Properties unchanged, skipping update");
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setIsLoading(false);
    }
  }, [contract, isLoading, properties, totalSupply]);

  // Initial fetch only
  useEffect(() => {
    if (!contract || !isInitialMount.current) return;
    
    console.log("Performing initial fetch");
    isInitialMount.current = false;
    fetchData(true);
  }, [contract, fetchData]);

  const handleRefresh = useCallback(() => {
    console.log("Manual refresh requested");
    fetchData(true);
  }, [fetchData]);

  // Helper function to format image URLs
  const getImageUrl = (imageHash: string): string => {
    if (!imageHash) return '';
    
    // Handle data URLs (for development mock images)
    if (imageHash.startsWith('data:')) {
      return imageHash;
    }
    
    // Handle full URLs
    if (imageHash.startsWith('http')) {
      return imageHash;
    }
    
    // Handle IPFS URLs
    if (imageHash.startsWith('ipfs://')) {
      return imageHash.replace('ipfs://', 'https://nftstorage.link/ipfs/');
    }
    
    // Default case: assume it's an IPFS CID
    return `https://nftstorage.link/ipfs/${imageHash}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Properties ({totalSupply})</h1>
        <button 
          onClick={handleRefresh}
          disabled={isLoading}
          className={`btn btn-primary ${isLoading ? "loading" : ""}`}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property, index) => (
          <div key={index} className="bg-base-100 shadow-xl rounded-lg overflow-hidden">
            {property.imageHash ? (
              <div className="relative h-48 w-full">
                <Image
                  src={getImageUrl(property.imageHash)}
                  alt={`Property at ${property.propertyAddress}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                  href={getImageUrl(property.valuationDocumentHash)}
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