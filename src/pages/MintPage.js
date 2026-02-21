import { useState } from "react";
import "./MintPage.css";
import { getImageById, getValidImageIds } from "../utils/imageMap";
import { mintNFT } from "../utils/soroban";



const MintPage = ({ walletAddress, server, setBalance }) => {
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("info"); // 'info', 'success', 'warning'
  const [lastMintedNft, setLastMintedNft] = useState(null);
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
    setLastMintedNft(null);
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
      // Use the utility function which handles Symbol conversion and simulation
      const result = await mintNFT(walletAddress, name, imageUrl.trim().toUpperCase());

      setStatus(`NFT Minted ✅ ${result.hash.slice(0, 8)}...`);
      setStatusType("success");
      setTxHash(result.hash);
      setLastMintedNft({ name: name.trim(), imageUrl: imageUrl.trim().toUpperCase() });
      setName("");
      setImageUrl("");
      await fetchBalance(); // Refresh balance after successful mint
    } catch (e) {
      setStatus(e.message);
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

      {lastMintedNft && (
        <div className="nft-preview-card">
          <h2 className="preview-title">Your New NFT!</h2>
          <img
            src={getImageById(lastMintedNft.imageUrl)}
            alt={lastMintedNft.name}
            className="preview-image"
          />
          <p className="preview-name">{lastMintedNft.name}</p>
        </div>
      )}
    </div>
  );
};

export default MintPage;