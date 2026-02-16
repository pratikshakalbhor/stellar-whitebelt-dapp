import { useState } from "react";
import "./App.css";
import { getAddress, signTransaction } from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";



function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  
  // NFT Mint Section
  const [nftName, setNftName] = useState("");
  const [nftStatus, setNftStatus] = useState("");
  const [nftLoading, setNftLoading] = useState(false);

  const server = new StellarSdk.Horizon.Server(
    "https://horizon-testnet.stellar.org"
  );

  const shortAddress = (addr) => {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-6);
  };

  // CONNECT WALLET
  const connectWallet = async () => {
    try {
      setLoading(true);
      setStatus("Connecting to Freighter...");

      const { address } = await getAddress();

      setWalletAddress(address);
      setStatus("Wallet Connected");

      const account = await server.loadAccount(address);
      const xlm = account.balances.find((b) => b.asset_type === "native");

      setBalance(parseFloat(xlm.balance).toFixed(2));
    } catch (e) {
      console.log(e);
      setStatus("Freighter connection failed");
    }

    setLoading(false);
  };

  // SEND REAL PAYMENT
  const sendPayment = async () => {
    if (!walletAddress) {
      setStatus("Connect wallet first");
      return;
    }

    if (!receiver || !amount) {
      setStatus("Enter receiver & amount");
      return;
    }

    if (!StellarSdk.StrKey.isValidEd25519PublicKey(receiver)) {
      setStatus("Invalid receiver address");
      return;
    }

    try {
      setLoading(true);
      setStatus("Preparing transaction...");

      const account = await server.loadAccount(walletAddress);
      const fee = await server.fetchBaseFee();

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: receiver.trim(),
            asset: StellarSdk.Asset.native(),
            amount: amount.toString(),
          })
        )
        .setTimeout(30)
        .build();

      const xdr = transaction.toXDR();

      const signedXDR = await signTransaction(xdr, {
        network: "TESTNET",
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      // Handle potential object return from Freighter
      const signedXDRString = typeof signedXDR === 'object' && signedXDR.signedTxXdr 
        ? signedXDR.signedTxXdr 
        : signedXDR;

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedXDRString,
        StellarSdk.Networks.TESTNET
      );

      setStatus("Submitting transaction...");
      const result = await server.submitTransaction(signedTx);

      setStatus("Payment Success! Hash: " + result.hash);

      // refresh balance
      const updated = await server.loadAccount(walletAddress);
      const xlm = updated.balances.find((b) => b.asset_type === "native");
      setBalance(parseFloat(xlm.balance).toFixed(2));

      setAmount("");
      setReceiver("");
    } catch (e) {
      console.error(e);
      if (e.response && e.response.data && e.response.data.extras) {
        const codes = e.response.data.extras.result_codes;
        setStatus(`Failed: ${codes.transaction || ""} ${codes.operations ? codes.operations.join(",") : ""}`);
      } else if (e.message) {
        setStatus(`Error: ${e.message}`);
      } else {
        setStatus("Transaction Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // MINT NFT (UI Only - No Smart Contract Logic)
  const mintNft = async () => {
    if (!walletAddress) {
      setNftStatus("Connect wallet first");
      return;
    }

    if (!nftName) {
      setNftStatus("Enter NFT name");
      return;
    }

    try {
      setNftLoading(true);
      setNftStatus("Pending");
      
      // UI Only - Simulating minting process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setNftStatus("Success");
      setNftName("");
    } catch (e) {
      console.log(e);
      setNftStatus("Failed");
    }

    setNftLoading(false);
  };

  return (
    <div className="app-container">
      <div className="card">
        <h1>Stellar Payment dApp</h1>

        {!walletAddress ? (
          <button className="button button-primary" onClick={connectWallet} disabled={loading}>
            {loading ? <><div className="spinner"></div> Connecting...</> : "Connect Wallet"}
          </button>
        ) : (
          <>
            <div className="status-badge connected">
              <span className="status-dot"></span>
              Wallet: {shortAddress(walletAddress)}
            </div>
            <h2>{balance} XLM</h2>

            <input
              className="form-input"
              placeholder="Receiver Address"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
            />
            <br />

            <input
              className="form-input"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <br />

            <button className="button button-primary" onClick={sendPayment} disabled={loading}>
              {loading ? <><div className="spinner"></div> Sending...</> : "Send XLM"}
            </button>
          </>
        )}

        {status && (
          <p
            className={`status-message ${
              status.includes("Success")
                ? "success"
                : status.includes("Failed") || status.includes("Error")
                ? "warning"
                : "info"
            }`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
