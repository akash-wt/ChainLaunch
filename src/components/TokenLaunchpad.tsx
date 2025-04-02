import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { createAssociatedTokenAccountInstruction, createInitializeMint2Instruction, createMintToInstruction, getAssociatedTokenAddressSync, getMinimumBalanceForRentExemptMint, MINT_SIZE, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";

export function TokenLaunchpad() {
    const [name, setName] = useState<string>('');
    const [symbol, setSymbol] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [initialSupply, setInitialSupply] = useState<number>();
    const wallet = useWallet();
    const { connection } = useConnection();

    async function createToken() {
        const lamports = await getMinimumBalanceForRentExemptMint(connection);
        const keypair = Keypair.generate();
        if (wallet.publicKey) {
            const transaction = new Transaction().add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: keypair.publicKey,
                    space: MINT_SIZE,
                    lamports,
                    programId: TOKEN_PROGRAM_ID,
                }),


                createInitializeMint2Instruction(keypair.publicKey, 9, wallet.publicKey, wallet.publicKey, TOKEN_PROGRAM_ID),
                
            );

            const latestBlockhash = await connection.getLatestBlockhash();
            transaction.recentBlockhash = latestBlockhash.blockhash;
            transaction.feePayer = wallet.publicKey;

            transaction.partialSign(keypair)
            const res = await wallet.sendTransaction(transaction, connection);
            console.log("Token Created:", res);



            // Create an associated token account
            const associatedToken = getAssociatedTokenAddressSync(  //calculates the associated token account address for the wallet
                keypair.publicKey,  //token mint acc
                wallet.publicKey,  // akash's_address
                false,
                TOKEN_PROGRAM_ID,  // Token program 
            );

            console.log(associatedToken.toBase58());

            const transaction2 = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedToken,
                    wallet.publicKey,
                    keypair.publicKey,
                    TOKEN_PROGRAM_ID,
                ),

                createMintToInstruction(keypair.publicKey, associatedToken, wallet.publicKey, initialSupply || 1000000, [], TOKEN_PROGRAM_ID)
            );

            await wallet.sendTransaction(transaction2, connection);

        }
    }

    return <div className="h-80vh flex justify-center items-center flex-col pb-10 pt-10">
        <h1>Solana Token Launchpad</h1>
        <input className='inputText' type='text' value={name} placeholder='Name' onChange={(e) => { String(setName(e.target.value)) }}></input> <br />
        <input className='inputText' type='text' value={symbol} placeholder='Symbol' onChange={(e) => { String(setSymbol(e.target.value)) }}></input> <br />
        <input className='inputText' type='text' value={imageUrl} placeholder='Image URL' onChange={(e) => { String(setImageUrl(e.target.value)) }} ></input> <br />
        <input className='inputText' type='text' value={initialSupply} placeholder='Initial Supply' onChange={(e) => { String(setInitialSupply(Number(e.target.value))) }}></input> <br />
        <button className='btn' onClick={createToken}>Create a token</button>
    </div>
}

