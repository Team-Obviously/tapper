import { Request, Response } from 'express';
import { JsonRpcProvider, Wallet, Contract } from 'ethers';

export async function getContractOwner(req: Request, res: Response) {
    try {
        // Contract details
        const contractAddress = '0x99C8CA6842C20F5428c8C17e6c79634e8dA539D8';
        const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
        const privateKey = '0x5a7e1edd1a4ae11a8f656693c15beb1aca778f5c42dd4ddf89984df73e79d71c';

        // Create a provider and wallet
        const provider = new JsonRpcProvider(rpcUrl);
        const wallet = new Wallet(privateKey, provider);

        // Simple ABI for the owner() function
        const abi = [
            'function owner() view returns (address)'
        ];

        // Create a contract instance with a signer
        const contract = new Contract(contractAddress, abi, wallet);

        console.log('Calling owner() function on contract:', contractAddress);

        // Call the owner function
        const owner = await contract.owner?.() as string;

        // Format output to match what cast would return
        const result = {
            contractAddress,
            owner,
            message: 'Owner retrieved successfully',
            transactionInfo: {
                from: wallet.address,
                to: contractAddress,
                network: 'Sepolia',
                function: 'owner()',
                result: owner
            }
        };

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error getting contract owner:', error);

        return res.status(500).json({
            error: 'Contract query failed',
            message: error.message || 'Failed to get contract owner'
        });
    }
}
