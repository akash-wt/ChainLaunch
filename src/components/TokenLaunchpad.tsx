import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import {
    createAssociatedTokenAccountInstruction, createInitializeMetadataPointerInstruction, createInitializeMint2Instruction,
    createMintToInstruction,
    ExtensionType,
    getAssociatedTokenAddressSync,
    getMintLen,
    LENGTH_SIZE,
    TOKEN_2022_PROGRAM_ID,
    TYPE_SIZE
} from '@solana/spl-token';
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

export function TokenLaunchpad() {
    const [name, setName] = useState<string>('');
    const [symbol, setSymbol] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');
    const [initialSupply, setInitialSupply] = useState<number>();
    const wallet = useWallet();
    const { connection } = useConnection();

    async function createToken() {

        const keypair = Keypair.generate();

        const metadata = {
            mint: keypair.publicKey,
            name: name,
            symbol: symbol,
            uri: imageUrl,
            additionalMetadata: [],
        };

        const mintLen = getMintLen([ExtensionType.MetadataPointer]);
        const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

        const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataLen);
        if (wallet.publicKey) {

            const transaction = new Transaction();

            // Step 1: Creating a new account for the mint
            transaction.add(
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: keypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),

                createInitializeMetadataPointerInstruction(keypair.publicKey, wallet.publicKey, keypair.publicKey, TOKEN_2022_PROGRAM_ID),

            );



            console.log("1. mint account created");

            // Step 2: Initializing the mint
            transaction.add(
                createInitializeMint2Instruction(keypair.publicKey, 9, wallet.publicKey, wallet.publicKey, TOKEN_2022_PROGRAM_ID),

                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    mint: keypair.publicKey,
                    metadata: keypair.publicKey,
                    name: metadata.name,
                    symbol: metadata.symbol,
                    uri: metadata.uri,
                    mintAuthority: wallet.publicKey,
                    updateAuthority: wallet.publicKey,
                }),

            );
            console.log("2. Initializing the mint");

            // Step 3: Creating Associated Token Account (ATA)
            const associatedToken = getAssociatedTokenAddressSync(
                keypair.publicKey,
                wallet.publicKey,
                false,
                TOKEN_2022_PROGRAM_ID,
            );
            console.log("3. Creating Associated Token Account (ATA) : " + associatedToken);

            transaction.add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    associatedToken,
                    wallet.publicKey,
                    keypair.publicKey,
                    TOKEN_2022_PROGRAM_ID,
                )
            );
            console.log("3. (ATA) : finished");

            // Step 4: Minting tokens to the Associated Token Account

            transaction.add(
                createMintToInstruction(keypair.publicKey, associatedToken, wallet.publicKey, initialSupply || 100000000000000, [], TOKEN_2022_PROGRAM_ID)

            );

            console.log("4. Minting tokens to the Associated Token Account");

            // Getting the latest blockhash and set the fee payer
            console.log("5. Getting the latest blockhash");

            const latestBlockhash = await connection.getLatestBlockhash();
            transaction.recentBlockhash = latestBlockhash.blockhash;
            transaction.feePayer = wallet.publicKey;
            // Sign the transaction
            console.log("6. Sign the transaction");


            try {
                transaction.partialSign(keypair)
                const res = await wallet.sendTransaction(transaction, connection);
                console.log("Token Created:", res);
            } catch (e) {
                console.error("Transaction signing failed:", e);
            }

            console.log("Coin created successfully");


        }
    }

    return <div className="h-80vh flex justify-center items-center flex-col pb-10 pt-10">
        <h1>Solana Token Launchpad</h1>
        <input className='inputText' type='text' value={name} placeholder='Name' onChange={(e) => { setName(e.target.value) }}></input> <br />
        <input className='inputText' type='text' value={symbol} placeholder='Symbol' onChange={(e) => { setSymbol(e.target.value) }}></input> <br />
        <input className='inputText' type='text' value={imageUrl} placeholder='Image URL' onChange={(e) => { setImageUrl(e.target.value) }} ></input> <br />
        <input className='inputText' type='text' value={initialSupply} placeholder='Initial Supply' onChange={(e) => { setInitialSupply(Number(e.target.value)) }}></input> <br />
        <button className='btn' onClick={createToken}>Create a token</button>
    </div>
}