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

    try {
      setLoading(true);
      setStatus("Preparing transaction...");

      const account = await server.loadAccount(walletAddress);

      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
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
        networkPassphrase: StellarSdk.Networks.TESTNET,
      });

      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedXDR,
        StellarSdk.Networks.TESTNET
      );

      const result = await server.submitTransaction(signedTx);

      setStatus("Payment Success! Hash: " + result.hash);

      // refresh balance
      const updated = await server.loadAccount(walletAddress);
      const xlm = updated.balances.find((b) => b.asset_type === "native");
      setBalance(parseFloat(xlm.balance).toFixed(2));

      setAmount("");
      setReceiver("");
    } catch (e) {
      console.log(e);
      if (e.error === "User declined access" || e.message === "User declined access") {
        setStatus("Transaction rejected by user");
      } else {
        setStatus("Transaction Failed");
      }
    }

    setLoading(false);
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

        <p className="status-message">{status}</p>
      </div>
    </div>
  );
}

export default App;
