
 import { Connection, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey, TransactionInstruction  } from "@solana/web3.js";
 import pkg from 'bs58';
 const { decode } = pkg;
 import solanaweb3 from "@solana/web3.js";
//  import {Program, web3 } from '@project-serum/anchor';
import BN from "bn.js";
import { findAll, findById, create, update, remove } from '../models/productModel.js';
// import idl from '../data/idl.json' assert { type: 'json' };
import { getPostData } from '../utils.js';

import anchor from '@project-serum/anchor';

// Set up the provider

// Initialize Solana connection
// const connection = new Connection("https://api.devnet.solana.com");
const connection = new solanaweb3.Connection(solanaweb3.clusterApiUrl('devnet'), 'confirmed');
process.env.ANCHOR_PROVIDER_URL = 'https://api.devnet.solana.com'; // Replace with your target cluster URL
// const provider = anchor.AnchorProvider.env();
// anchor.setProvider(provider);
// Program ID for the custom Solana program
const programId = new PublicKey("9FkQWWAuSepjpHQoJKTKVV2ryYCvWd74tCdhTuUaGvBf");



// Load wallets from secret keys
const senderWallet = Keypair.fromSecretKey(
    decode("3Je6TT1dG98DvRr9VKazNjgBLwP8XHM75F3Mxt6VxvLksfaRG5EyENjxmEwXYXKKhBkyVB7turqy3ftXtEkHH6mb")
);

const receiverWallet = Keypair.fromSecretKey(

    decode("jFxv3ap4YY9tR3d94KuhR5b4k7uPEnCsbb9zzwnszirTpvxNRwsik3Um3ypP1eFh9s3rv3hrxohx67mhAAXjzex")

);
// const program = new Program(idl, programId, provider);
// Example function to interact with the Solana program
export async function sendTransaction(req, res) {
    try {
       
        const instructionData = Buffer.from([1]); // Replace with actual data for the program

        // Create a transaction instruction for the custom program
        const instruction = new TransactionInstruction({
            keys: [
                { pubkey: senderWallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: '7wewpgFL6AD8fw63rKPgWhECCgqWLwv14PEu5ARacaeo', isSigner: false, isWritable: true }
            ],
            programId: programId, // Use the program ID here
            data: instructionData // Include any data needed for your program
        });

        // Create and send the transaction
        const transaction = new Transaction().add(instruction);

        const transactionHash = await connection.sendTransaction(transaction, [senderWallet]);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(`txhash: ${transactionHash}`));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
}

export async function withdrawFromTreasury(req, res) {
    try {
        const adminArrKey = Uint8Array.from([
            44, 146, 74, 69, 21, 100, 33, 162, 109, 227, 250, 219, 108, 136, 1, 167,
            159, 20, 86, 80, 62, 166, 136, 172, 158, 53, 87, 205, 234, 202, 131,
            226, 103, 38, 99, 217, 11, 217, 4, 15, 255, 244, 128, 105, 88, 62, 247,
            131, 209, 126, 78, 112, 219, 169, 128, 154, 128, 67, 169, 200, 34, 79,
            219, 252,
        ]);

        // Deriving PDA addresses for treasury and admin
        const [treasuryPDA, _] = await PublicKey.findProgramAddress(
            [Buffer.from("treasury")],
            programId
        );

        const [adminPDA, __] = await PublicKey.findProgramAddress(
            [Buffer.from("admin-account")],
            programId
        );

        const adminAcc = Keypair.fromSecretKey(adminArrKey);
        const oldTreasuryBalance = new BN(await connection.getBalance(treasuryPDA));

        const amountToWithdraw = new BN(oldTreasuryBalance.toNumber() / 2);
        console.log("Old treasury balance: ", oldTreasuryBalance.toNumber());

        // Creating and sending transaction
   
        // const amountToWithdraw = 1000; // Example amount to withdraw

        const transaction = new solanaWeb3.Transaction().add(
            new solanaWeb3.TransactionInstruction({
                keys: [
                    { pubkey: adminAcc.publicKey, isSigner: true, isWritable: true },
                    { pubkey: treasuryPDA, isSigner: false, isWritable: true },
                    { pubkey: adminPDA, isSigner: false, isWritable: true },
                    { pubkey: solanaWeb3.SystemProgram.programId, isSigner: false, isWritable: false },
                ],
                programId: new solanaWeb3.PublicKey(programId),
                data: Buffer.concat([
                    Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), // 8-byte identifier for "withdraw" instruction
                    Buffer.from(new Uint8Array(new BN(amountToWithdraw).toArray("le", 8))) // amount to withdraw as 8 bytes in little-endian
                ]), 
            })
        );
      // Send the transaction to the network
      const transactionHash = await connection.sendTransaction(transaction, [adminAcc]);


        const signature = await connection.sendTransaction(transaction, [adminAcc]);

        const newTreasuryBalance = new BN(await connection.getBalance(treasuryPDA));
        console.log("New treasury balance: ", newTreasuryBalance.toNumber());

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            signature,
            newTreasuryBalance: newTreasuryBalance.toNumber(),
            oldTreasuryBalance: oldTreasuryBalance.toNumber()
        }));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
}




export async function getBalance(req, res)  {
    try {
        
        const body = await getPostData(req)

        const { programID } = JSON.parse(body)
       
        if (!programID ) {
            throw new Error("Missing or invalid  programID.");
        }
        // Derive the PDA using a seed and the programId
        const [treasuryPDA] = await solanaweb3.PublicKey.findProgramAddress(
            [Buffer.from("treasury")], // Replace "treasury" with your actual seed
            new solanaweb3.PublicKey(programID)
        );
        
        const treasuryBalance = await connection.getBalance(treasuryPDA);

        // Prepare the JSON response with balances
        const jsondata = {
            treasuryBalance: `${treasuryBalance / LAMPORTS_PER_SOL} SOL`, // PDA balance
            programId: programID
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(jsondata));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
}

// Your connection to the Solana cluster (e.g., Devnet)


export async function getUserBalance(req, res) {
    try {
        
        const body = await getPostData(req)

        const { userPubkeyx, programID } = JSON.parse(body)
       

        if (!userPubkeyx ) {
            throw new Error("Missing or invalid userPubkey.");
        }
        if (!programID ) {
            throw new Error("Missing or invalid  programID.");
        }
      
        const userPubkey = new solanaweb3.PublicKey(userPubkeyx);
        // Derive the PDA for the user's balance account using the userPubkey and programId
        const [userBalancePDA] = await solanaweb3.PublicKey.findProgramAddress(
            [Buffer.from("user-balance"), userPubkey.toBuffer()],
            new solanaweb3.PublicKey(programID)
        );

        // Fetch the balance from the derived PDA
        const userBalance = await connection.getBalance(userBalancePDA);

        // Return the user's balance in SOL
        const jsondata = {
            userBalance: userBalance / LAMPORTS_PER_SOL,
            userPublicKey: userPubkey.toString(), // Public key should be a string in response
            programId: programID
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(jsondata));
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
}



export async function getProducts(req, res) {
    try {
        const products = await findAll()

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(products))
    } catch (error) {
        console.log(error) 
    }
}

// @desc    Gets Single Product
// @route   GET /api/product/:id
export async function getProduct(req, res, id) {
    try {
        const product = await findById(id)

        if(!product) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Product Not Found' }))
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(product))
        }
    } catch (error) {
        console.log(error)
    }
}

// @desc    Create a Product
// @route   POST /api/products
export async function createProduct(req, res) {
    try {
        const body = await getPostData(req)

        const { name, description, price } = JSON.parse(body)

        const product = {
            name,
            description,
            price
        }

        const newProduct = await create(product)

        res.writeHead(201, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify(newProduct))  

    } catch (error) {
        console.log(error)
    }
}

// @desc    Update a Product
// @route   PUT /api/products/:id
export async function updateProduct(req, res, id) {
    try {
        const product = await findById(id)

        if(!product) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Product Not Found' }))
        } else {
            const body = await getPostData(req)

            const { name, description, price } = JSON.parse(body)

            const productData = {
                name: name || product.name,
                description: description || product.description,
                price: price || product.price
            }

            const updProduct = await update(id, productData)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify(updProduct)) 
        }
 

    } catch (error) {
        console.log(error)
    }
}

// @desc    Delete Product
// @route   DELETE /api/product/:id
export async function deleteProduct(req, res, id) {
    try {
        const product = await findById(id)

        if(!product) {
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: 'Product Not Found' }))
        } else {
            await remove(id)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ message: `Product ${id} removed` }))
        }
    } catch (error) {
        console.log(error)
    }
}

export default {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getBalance,

    sendTransaction
}