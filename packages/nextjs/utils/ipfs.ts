import { NFTStorage } from 'nft.storage';

// Mock IPFS implementation for local development
class MockIPFSStorage {
  private static mockCIDCounter = 0;

  // Generate a mock image as base64 data URL
  public createMockImageDataUrl(): string {
    // Create a small colored rectangle as SVG
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#${Math.floor(Math.random()*16777215).toString(16)}" />
        <text x="50%" y="50%" font-family="Arial" font-size="16" fill="white" text-anchor="middle">
          Mock Image ${MockIPFSStorage.mockCIDCounter}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  async store(data: any): Promise<any> {
    const mockCID = `mock-cid-${++MockIPFSStorage.mockCIDCounter}`;
    const mockImageUrl = this.createMockImageDataUrl();
    console.log('[Mock IPFS] Stored data with CID:', mockCID, data);
    
    return {
      url: mockImageUrl,
      data: {
        image: {
          href: mockImageUrl
        }
      }
    };
  }

  async storeBlob(blob: Blob): Promise<string> {
    const mockCID = `mock-cid-${++MockIPFSStorage.mockCIDCounter}`;
    const mockImageUrl = this.createMockImageDataUrl();
    console.log('[Mock IPFS] Stored blob with CID:', mockCID);
    return mockImageUrl;
  }
}

const DEBUG = true;

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[IPFS Debug]:', ...args);
  }
}

// Determine if we're in development mode
const isDev = process.env.NEXT_PUBLIC_DEPLOY_MODE !== 'production';

// Initialize NFT.Storage client with validation
let client: NFTStorage | MockIPFSStorage;

if (!isDev) {
  const token = process.env.NEXT_PUBLIC_NFT_STORAGE_TOKEN;
  if (!token) {
    throw new Error('NFT.Storage token is required in production mode');
  }
  client = new NFTStorage({ token });
  debugLog('Initialized NFT.Storage client in production mode');
} else {
  client = new MockIPFSStorage();
  debugLog('Initialized Mock Storage client in development mode');
}

async function fileToNFTStorageFile(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  return new File([buffer], file.name, { type: file.type });
}

export async function uploadToIPFS(file: File): Promise<string> {
  if (!file) return '';

  debugLog('Starting file upload to IPFS:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    mode: isDev ? 'development' : 'production',
    deployMode: process.env.NEXT_PUBLIC_DEPLOY_MODE
  });

  try {
    if (isDev) {
      const mockStorage = client as MockIPFSStorage;
      return mockStorage.createMockImageDataUrl();
    }

    const nftFile = await fileToNFTStorageFile(file);
    const nftStorage = client as NFTStorage;
    
    debugLog('Uploading file to NFT.Storage...');
    const cid = await nftStorage.storeBlob(nftFile);
    
    if (!cid) {
      throw new Error('Failed to get CID from NFT.Storage');
    }

    const url = `https://nftstorage.link/ipfs/${cid}`;
    debugLog('File uploaded successfully, URL:', url);
    return url;
  } catch (error) {
    debugLog('Upload error:', error);
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function uploadJsonToIPFS(data: any): Promise<string> {
  debugLog('Starting metadata upload', {
    mode: isDev ? 'development' : 'production',
    deployMode: process.env.NEXT_PUBLIC_DEPLOY_MODE
  });
  
  try {
    if (isDev) {
      const mockStorage = client as MockIPFSStorage;
      return (await mockStorage.store(data)).url;
    }

    const nftStorage = client as NFTStorage;
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const cid = await nftStorage.storeBlob(blob);
    
    if (!cid) {
      throw new Error('Failed to get CID from NFT.Storage');
    }

    const url = `https://nftstorage.link/ipfs/${cid}`;
    debugLog('Metadata uploaded successfully, URL:', url);
    return url;
  } catch (error) {
    debugLog('Metadata upload error:', error);
    throw new Error(`Metadata upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function createAndUploadMetadata(
  propertyAddress: string,
  bedrooms: string,
  bathrooms: string,
  appraisedValue: string,
  imageUrl: string,
  valuationDocumentUrl: string
): Promise<string> {
  debugLog('Creating metadata for property:', propertyAddress);
  
  const metadata = {
    name: `Real Estate NFT - ${propertyAddress}`,
    description: `Property at ${propertyAddress}`,
    image: imageUrl,
    attributes: [
      {
        trait_type: "Property Address",
        value: propertyAddress
      },
      {
        trait_type: "Bedrooms",
        value: parseInt(bedrooms)
      },
      {
        trait_type: "Bathrooms",
        value: parseInt(bathrooms)
      },
      {
        trait_type: "Appraised Value",
        value: parseInt(appraisedValue)
      },
      {
        trait_type: "Valuation Document",
        value: valuationDocumentUrl || "Not provided"
      }
    ]
  };

  debugLog('Created metadata object:', metadata);
  return uploadJsonToIPFS(metadata);
} 