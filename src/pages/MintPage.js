import { useState } from "react";
import "./MintPage.css";
import { getValidImageIds } from "../utils/imageMap";
import { mintNFT, fetchNFTs } from "../utils/soroban";



const MintPage = ({ walletAddress, server, setBalance, setNfts, nfts }) => {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info"); // 'info', 'success', 'warning'
  const [txHash, setTxHash] = useState("");

  const fetchBalance = async () => {
    try {
      const account = await server.loadAccount(walletAddress);
      const xlmBalance = account.balances.find(
        (b) => b.asset_type === "native"
      );
      setBalance(parseFloat(xlmBalance.balance).toFixed(2));
    } catch (e) {
      console.error("Failed to fetch balance on mint page", e);
    }
  };

  const handleMint = async () => {
    setTxHash("");
    if (!name || !imageUrl) {
      setStatus("Please enter a name and image ID.");
      setStatusType("warning");
      return;
    }

    const validImageIds = getValidImageIds();
    if (!validImageIds.includes(imageUrl.trim().toUpperCase())) {
      setStatus(`Invalid Image ID. Use: ${validImageIds.join(", ")}`);
      setStatusType("warning");
      return;
    }

    setLoading(true);
    setStatus("Please approve the transaction in Freighter...");
    setStatusType("info");

    try {
      const result = await mintNFT(walletAddress, name, imageUrl.trim().toUpperCase());

      if (result.status === "CANCELLED") {
        setStatus("User Cancelled Transaction");
        setStatusType("warning");
        setLoading(false);
        return;
      }

      if (result.status === "FAILED") {
        setStatus("Transaction Failed");
        setStatusType("warning");
        setLoading(false);
        return;
      }

      setStatus(`NFT Minted ✅ ${result.hash.substring(0, 8)}...`);
      setStatusType("success");
      setTxHash(result.hash);
      
      // Fetch updated NFTs from blockchain instead of local update
      const updatedNfts = await fetchNFTs(walletAddress);
      setNfts(updatedNfts);

      setName("");
      setImageUrl("");
      await fetchBalance(); // Refresh balance after successful mint
    } catch (e) {
      setStatus(e?.message || "Transaction failed.");
      setStatusType("warning");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h1 className="title">Mint an NFT</h1>
      <p className="subtitle">Create a new unique token on the blockchain.</p>

      <div className="form-group">
        <input
          type="text"
          className="form-input"
          placeholder="NFT Name (e.g. My Awesome NFT)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <input
          type="text"
          className="form-input"
          placeholder="Image ID (e.g. IMG1, IMG2, or IMG3)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          disabled={loading}
        />
      </div>

      <button className="button button-primary" onClick={handleMint} disabled={loading}>
        {loading ? <><span className="spinner"></span> Minting...</> : "Mint NFT"}
      </button>

      {status && <p className={`status-message ${statusType}`}>{status}</p>}

      {txHash && (
        <div className="status-message success">
          <p>Tx: {txHash}</p>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
};

export default MintPage;