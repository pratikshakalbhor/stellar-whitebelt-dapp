#![no_std]

use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};

// --- STORAGE KEYS ---
// This contract uses a combination of a single instance-level key (`TOTAL`)
// and dynamic keys for each NFT's data. Dynamic keys are created by combining
// a base Symbol (like `OWNER`) with the NFT's unique ID.

// Key for storing the total number of NFTs minted. A single u32 value.
const TOTAL: Symbol = symbol_short!("TOTAL");
// Base key for storing the owner of an NFT. The full key is a tuple: `(OWNER, nft_id)`.
const OWNER: Symbol = symbol_short!("OWNER");
// Base key for storing the name of an NFT. The full key is a tuple: `(NAME, nft_id)`.
const NAME: Symbol = symbol_short!("NAME");
// Base key for storing the image URL of an NFT. The full key is a tuple: `(IMAGE, nft_id)`.
const IMAGE: Symbol = symbol_short!("IMAGE");

#[contract]
pub struct NFTContract;

#[contractimpl]
impl NFTContract {
    /// Mints a new NFT, assigning it to the specified owner.
    ///
    /// # Arguments
    ///
    /// * `env` - The Soroban environment.
    /// * `owner` - The address that will own the new NFT.
    /// * `name` - The name for the new NFT (e.g., "My First NFT").
    /// * `image_url` - The URL for the NFT's image.
    pub fn mint_nft(env: Env, owner: Address, name: Symbol, image_url: Symbol) {
        // Ensure the owner has authorized this transaction.
        owner.require_auth();

        // Get the current total number of NFTs, or 0 if none have been minted.
        let mut total: u32 = Self::get_total(&env);

        // Increment the total to create a new, unique ID for our NFT.
        total += 1;
        let nft_id = total;

        // --- Store NFT Data ---
        // We use a tuple `(Symbol, u32)` as a dynamic key. This is an efficient and safe
        // way to create unique storage keys for each piece of data related to an NFT.

        // Store the owner for this NFT ID. Key: `("OWNER", 1)`, Value: `owner_address`
        env.storage()
            .instance()
            .set(&(OWNER, nft_id), &owner);

        // Store the name for this NFT ID. Key: `("NAME", 1)`, Value: `"My First NFT"`
        env.storage()
            .instance()
            .set(&(NAME, nft_id), &name);

        // Store the image URL for this NFT ID. Key: `("IMAGE", 1)`, Value: `"http://.../img.png"`
        env.storage()
            .instance()
            .set(&(IMAGE, nft_id), &image_url);

        // Finally, update the total number of NFTs.
        env.storage().instance().set(&TOTAL, &nft_id);
    }

    /// Returns the total number of NFTs minted so far.
    pub fn get_total(env: &Env) -> u32 {
        env.storage().instance().get(&TOTAL).unwrap_or(0)
    }

    /// Returns the owner of the NFT with the given ID.
    /// Panics if the ID is invalid or does not exist.
    pub fn get_owner(env: Env, id: u32) -> Address {
        Self::check_nft_exists(&env, id);
        let key = (OWNER, id);
        env.storage().instance().get(&key).unwrap()
    }

    /// Returns the name of the NFT with the given ID.
    /// Panics if the ID is invalid or does not exist.
    pub fn get_name(env: Env, id: u32) -> Symbol {
        Self::check_nft_exists(&env, id);
        let key = (NAME, id);
        env.storage().instance().get(&key).unwrap()
    }

    /// Returns the image URL of the NFT with the given ID.
    /// Panics if the ID is invalid or does not exist.
    pub fn get_image(env: Env, id: u32) -> Symbol {
        Self::check_nft_exists(&env, id);
        let key = (IMAGE, id);
        env.storage().instance().get(&key).unwrap()
    }

    /// Helper function to check if an NFT ID is valid.
    fn check_nft_exists(env: &Env, id: u32) {
        let total = Self::get_total(env);
        if id == 0 || id > total {
            panic!("NFT with this ID does not exist");
        }
    }
}
