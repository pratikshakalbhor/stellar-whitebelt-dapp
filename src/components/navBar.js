import React from "react";
import { NavLink } from "react-router-dom";   // Import NavLink for active link styling / highlight and  page navigation.

export default function NavBar() {   // NavBar component create with links to Payment and Mint NFT pages.
  return (
    <nav className="nav-bar">        
      <NavLink
        to="/"                  // Link to the Payment page , / is the root path pointing to the PaymentPage component in App.js.
        className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
      >
        Payment
      </NavLink>         
          
      <NavLink                       // Link to the Mint NFT page, /mint path pointing to the MintPage component in App.js.
        to="/mint"
        className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
      >
        Mint NFT
      </NavLink>
    </nav>
  );
}