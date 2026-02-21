import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  Operation,
  xdr,
  scValToNative,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

const CONTRACT_ID = "CBT2NS4ZF3JZFQUJEI6UMWABIOUX7NRBVYBN52OTDPIS4WVJ6BGMXNQC";
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

export const mintNFT = async (owner, name, imageId) => {
  // Use a single try/catch block to handle all errors and normalize the output.
  try {
    // 1. --- Input Validation ---
    // Ensure all required parameters are provided and are of the correct type.
    if (!owner || typeof owner !== 'string') {
      throw new Error("INVALID_OWNER");
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error("INVALID_NAME");
    }
    if (!imageId || typeof imageId !== 'string' || imageId.trim() === '') {
      throw new Error("INVALID_IMAGE_ID");
    }

    const server = new SorobanRpc.Server(RPC_URL, { allowHttp: true });
    const cleanName = name.trim().toUpperCase();
    const cleanImageId = imageId.trim().toUpperCase();

    // 2. --- Fetch Source Account ---
    // Defensively fetch the account. If it fails, the catch block will handle it.
    const sourceAccount = await server.getAccount(owner);
    if (!sourceAccount) {
        throw new Error("ACCOUNT_NOT_FOUND");
    }

    // 3. --- Build Transaction ---
    const op = Operation.invokeContractFunction({
      contract: CONTRACT_ID,
      function: "mint_nft",
      args: [
        new Address(owner).toScVal(),
        xdr.ScVal.scvSymbol(cleanName),
        xdr.ScVal.scvSymbol(cleanImageId),
      ],
    });

    const tx = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    // 4. --- Simulate Transaction ---
    // Ensure simulation is successful before proceeding.
    const simulation = await server.simulateTransaction(tx);
    if (!simulation || SorobanRpc.Api.isSimulationError(simulation) || simulation.status === "ERROR") {
      console.error("Soroban simulation failed:", simulation);
      throw new Error("SIMULATION_FAILED");
    }

    // 5. --- Assemble Transaction ---
    const preparedTx = SorobanRpc.assembleTransaction(tx, simulation).build();

    // 6. --- Sign & Submit Transaction ---
    try {
      const signed = await signTransaction(preparedTx.toXDR(), {
        network: "TESTNET",
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      if (!signed) {
        return { status: "CANCELLED" };
      }

      const signedXdr =
        typeof signed === "string" ? signed : signed.signedTxXdr;

      const signedTx = TransactionBuilder.fromXDR(
        signedXdr,
        NETWORK_PASSPHRASE
      );

      const sendResponse = await server.sendTransaction(signedTx);

      if (!sendResponse.hash) {
        return { status: "FAILED" };
      }

      return {
        status: "SUCCESS",
        hash: sendResponse.hash
      };

    } catch (e) {
      const msg = e?.message?.toLowerCase() || "";

      if (
        msg.includes("declined") ||
        msg.includes("rejected") ||
        msg.includes("user cancelled") ||
        msg.includes("cancel")
      ) {
        return { status: "CANCELLED" };
      }

      return {
        status: "FAILED",
        error: e.message
      };
    }
  } catch (error) {
    // 10. --- Global Error Handler & Normalizer ---
    // All errors thrown in the try block are caught here and normalized.
    console.error("mintNFT error:", error);
    const errorMessage = error.message || "UNKNOWN_ERROR";

    if (errorMessage.includes("USER_CANCELLED")) {
      return { status: "CANCELLED", error: "User cancelled the transaction." };
    }
    if (errorMessage.includes("SIMULATION_FAILED")) {
      return { status: "FAILED", error: "Transaction simulation failed. Please check parameters." };
    }
    if (errorMessage.includes("SUBMISSION_FAILED")) {
      return { status: "FAILED", error: "Transaction submission failed to the network." };
    }
    if (errorMessage.includes("INVALID_XDR")) {
      return { status: "FAILED", error: "The transaction signature from the wallet was invalid." };
    }
    if (errorMessage.includes("ACCOUNT_NOT_FOUND")) {
      return { status: "FAILED", error: "The source account was not found on the network." };
    }
    if (errorMessage.includes("INVALID_OWNER") || errorMessage.includes("INVALID_NAME") || errorMessage.includes("INVALID_IMAGE_ID")) {
      return { status: "FAILED", error: "Invalid input parameters provided for minting." };
    }

    // Default case for any other unexpected errors.
    return { status: "FAILED", error: "An unexpected error occurred." };
  }
};

export const fetchNFTs = async (address) => {
  const server = new SorobanRpc.Server(RPC_URL, { allowHttp: true });

  try {
    const account = await server.getAccount(address);

    const op = Operation.invokeContractFunction({
      contract: CONTRACT_ID,
      function: "get_nfts",
      args: [], // Fetch ALL NFTs (or change to get_nfts_by_owner if your contract supports it)
    });

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(op)
      .setTimeout(30)
      .build();

    const simulation = await server.simulateTransaction(tx);

    if (SorobanRpc.Api.isSimulationError(simulation)) {
      console.warn("Simulation error during fetch:", simulation);
      return [];
    }

    if (!simulation.result?.retval) return [];

    return scValToNative(simulation.result.retval);
  } catch (e) {
    console.error("Fetch NFTs failed:", e);
    return [];
  }
};