import { useState, useEffect, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import { getAddress } from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";
import NavBar from "./components/navBar";
import PaymentPage from "./pages/PaymentPage";
import MintPage from "./pages/MintPage";

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [connectStatus, setConnectStatus] = useState("");

  const server = useMemo(
    () => new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org"),
    []
  );

  const connectWallet = async () => {
    try {
      setLoading(true);
      setConnectStatus("Connecting...");
      const { address } = await getAddress();
      if (address) {
        setWalletAddress(address);
        setConnectStatus("Wallet Connected!");
      } else {
        setConnectStatus("Wallet connection was closed.");
      }
    } catch (e) {
      console.error(e);
      setConnectStatus("Connection failed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (walletAddress) {
        try {
          const account = await server.loadAccount(walletAddress);
          const xlmBalance = account.balances.find(
            (b) => b.asset_type === "native"
          );
          setBalance(parseFloat(xlmBalance.balance).toFixed(2));
        } catch (e) {
          console.error("Failed to fetch balance", e);
          setBalance("N/A");
        }
      }
    };
    fetchBalance();
  }, [walletAddress, server]);

  return (
    <div className="app-container">
      <div className="particles">
        {[...Array(25)].map((_, i) => (
          <span key={i}></span>
        ))}
      </div>
      {!walletAddress ? (
        <div className="card">
          <h1 className="title">Stellar Payment dApp</h1>
          <p className="subtitle">Connect your wallet to get started</p>
          <button
            className="button button-primary button-large"
            onClick={connectWallet}
            disabled={loading}
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
          {connectStatus && (
            <p className="status-message info">{connectStatus}</p>
          )}
        </div>
      ) : (
        <>
          <NavBar walletAddress={walletAddress} />
          <Routes>
            <Route
              path="/"
              element={
                <PaymentPage
                  walletAddress={walletAddress}
                  balance={balance}
                  setBalance={setBalance}
                  server={server}
                />
              }
            />
            <Route
              path="/mint"
              element={
                <MintPage
                  walletAddress={walletAddress}
                  server={server}
                  setBalance={setBalance}
                />
              }
            />
          </Routes>
        </>
      )}
    </div>
  );
}

export default App;
