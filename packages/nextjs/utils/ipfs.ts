import { Web3Storage } from 'web3.storage';

const client = new Web3Storage({ token: process.env.NEXT_PUBLIC_WEB3_STORAGE_TOKEN || '' });

export async function uploadToIPFS(file: File): Promise<string> {
  if (!file) return '';

  try {
    const cid = await client.put([file]);
    return cid;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    return '';
  }
}

export async function uploadJsonToIPFS(data: any): Promise<string> {
  try {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const file = new File([blob], 'metadata.json');
    const cid = await client.put([file]);
    return cid;
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error('Failed to upload JSON to IPFS');
  }
} 