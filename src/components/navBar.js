import React from "react";
import { NavLink } from "react-router-dom";
import "./navBar.css";

const NavBar = ({ walletAddress }) => {
  const shortenAddress = (address) => {
    if (!address) return "";
    // Use G... for Stellar addresses
    return `${address.substring(0, 4)}...${address.substring(
      address.length - 4
    )}`;
  };

  return (
    <header className="main-navbar">
      <div className="navbar-left">
        <div className="brand-name">Stellar dApp</div>
        <div className="brand-tagline">
          Secure Payments & NFT Minting on Stellar
        </div>
      </div>

      {walletAddress && (
        <nav className="navbar-center">
          <NavLink to="/" className="nav-pill">
            Payment
          </NavLink>
          <NavLink to="/mint" className="nav-pill">
            Mint NFT
          </NavLink>
          <NavLink to="/gallery" className="nav-pill">
            Gallery
          </NavLink>
        </nav>
      )}

      <div className="navbar-right">
        {walletAddress ? (
          <div className="wallet-status connected">
            <span className="status-dot"></span>
            {shortenAddress(walletAddress)}
          </div>
        ) : (
          <div className="wallet-status disconnected">Wallet Not Connected</div>
        )}
      </div>
    </header>
  );
};

export default NavBar;