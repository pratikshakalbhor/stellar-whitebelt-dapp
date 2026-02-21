import React from 'react';
import { getImageById } from "../utils/imageMap";
import '../utils/GalleryPage.css';

export default function GalleryPage({ nfts }) {
  if (!nfts || nfts.length === 0) {
    return (
      <div className="card">
        <h2>No NFTs minted yet</h2>
      </div>
    );
  }

  return (
    <div className="card">
      <h1>My NFT Gallery</h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 16
      }}>
        {nfts.map((nft, i) => (
          <div key={i} className="nft-preview-card">
            <img
              src={getImageById(nft.imageId)}
              alt={nft.name}
              className="preview-image"
            />
            <p>{nft.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}