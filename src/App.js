import { useState } from "react";
import "./App.css";
import { setAllowed, getAddress } from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("0.00");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const server = new StellarSdk.Horizon.Server(
    "https://horizon-testnet.stellar.org"
  );

  const handleConnectWallet = async () => {
    try {
      setStatus("Connecting to Freighter...");
      setIsLoading(true);

      await setAllowed();
      const { address } = await getAddress();

      setWalletAddress(address);
      setIsConnected(true);
      setStatus("Wallet connected");

      // Fetch balance
      const account = await server.loadAccount(address);
      const xlmBalance = account.balances.find(
        (b) => b.asset_type === "native"
      );

      setBalance(parseFloat(xlmBalance.balance).toFixed(2));
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setStatus("Freighter not found or permission denied");
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setWalletAddress("");
    setBalance("0.00");
    setStatus("Wallet disconnected");
  };

  const handleSendPayment = () => {
    if (!receiver || !amount) {
      setStatus(" Fill all fields");
      return;
    }

    if (parseFloat(amount) <= 0) {
      setStatus(" Amount must be greater than 0");
      return;
    }

    setStatus("Transaction feature coming next...");
  };

  const truncateAddress = (address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-6)}` : "";
  };

  return (
    <div className="app-container">
      <div className="card">
        <div className="card-header">
          <h1 className="title">Stellar Payment dApp</h1>
          <p className="subtitle">Send XLM payments on Stellar Network</p>
        </div>

        <div className="wallet-section">
          {isConnected ? (
            <>
              <div className="status-badge connected">
                <span className="status-dot"></span>
                Connected
              </div>

              <div className="wallet-info">
                <div className="info-group">
                  <label className="info-label">Wallet Address</label>
                  <div className="address-display">
                    <span className="address-text">
                      {truncateAddress(walletAddress)}
                    </span>
                  </div>
                </div>

                <div className="info-group">
                  <label className="info-label">Available Balance</label>
                  <div className="balance-display">
                    <span className="balance-amount">{balance}</span>
                    <span className="balance-symbol"> XLM</span>
                  </div>
                </div>
              </div>

              <button
                className="button button-secondary"
                onClick={handleDisconnect}
              >
                Disconnect Wallet
              </button>
            </>
          ) : (
            <button
              className="button button-primary"
              onClick={handleConnectWallet}
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>

        {isConnected && (
          <div className="payment-section">
            <div className="divider"></div>

            <h2 className="section-title">Send Payment</h2>

            <div className="form-group">
              <label className="form-label">Receiver Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter Stellar address"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amount</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <button
              className="button button-primary button-large"
              onClick={handleSendPayment}
            >
              Send XLM
            </button>
          </div>
        )}

        {status && <div className="status-message">{status}</div>}
      </div>
    </div>
  );
}

export default App;