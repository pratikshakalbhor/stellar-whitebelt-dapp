import {
  SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Address,
  Operation,
  xdr,
} from "@stellar/stellar-sdk";
import { signTransaction } from "@stellar/freighter-api";

const CONTRACT_ID = "CD57MDP7CALDA2F63EH2D66QDGVCIZENIKIX5BFFZ5CNB3ACM3L7XM2Q";
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;

export const mintNFT = async (owner, name, imageId) => {
  const server = new SorobanRpc.Server(RPC_URL, { allowHttp: true });

  const cleanName = name.trim().toUpperCase();
  const cleanImageId = imageId.trim().toUpperCase();

  const sourceAccount = await server.getAccount(owner);

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

  const simulation = await server.simulateTransaction(tx);

  if (SorobanRpc.Api.isSimulationError(simulation)) {
    throw new Error(simulation.error);
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simulation).build();

  const signed = await signTransaction(preparedTx.toXDR(), {
    network: "TESTNET",
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const signedXdr =
    typeof signed === "string" ? signed : signed.signedTxXdr;

  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  const sendResponse = await server.sendTransaction(signedTx);

  if (!sendResponse.hash) {
    throw new Error("No hash returned");
  }

  return { hash: sendResponse.hash };
};