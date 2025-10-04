# RWAvengers — Carbon Credit Tokenization (Monad Blitz)

A fast, minimal RWA prototype that mints verifiable **carbon credit tokens** on Monad Testnet and exposes a simple front-end for registry/retire flows.

---

## ✨ TL;DR
- **Problem:** Carbon credits are fragmented, slow to verify, and opaque at retirement.
- **Solution:** Batch-minted carbon credits with embedded metadata (project, methodology, vintage), on-chain registry, and **verifiable retirement** with proofs + off-chain MRV attestations.
- **Stack:** Solidity (EVM), minimal Node/TypeScript front-end, wallet + explorer integration for Monad testnet.

---

## 🧱 Architecture

[![Image](https://i.hizliresim.com/5mg5saz.jpg)](https://hizliresim.com/5mg5saz)


> **MRV = Measurement, Reporting, Verification.** We reference an off-chain attestation per minted batch and per retirement.

## Demo
👉 [Live Demo](https://rwavengers.netlify.app/)
---

## Contract Addresses
- Uniswap V2 Factory:  [0x5b191e51db475ecb7d1adfb0dcba28e53426153f](https://monad-testnet.socialscan.io/address/0x5b191e51db475ecb7d1adfb0dcba28e53426153f)
- Uniswap V2 Pair:  [0x17aD1c0Df4e6c7C027f9d1Ad35Ef1D5D72767797](https://monad-testnet.socialscan.io/address/0x17ad1c0df4e6c7c027f9d1ad35ef1d5d72767797)
- Stable Token (USDC): [0x0608c5413F33c6561b612012623A3A26Eb10B8f6](https://monad-testnet.socialscan.io/address/0x0608c5413f33c6561b612012623a3a26eb10b8f6)
- CarbonBlitz (CBLTZ): [0x9b79231a9D37fdda4B21ACc0Eb503CB06d8c688C](https://monad-testnet.socialscan.io/address/0x9b79231a9d37fdda4b21acc0eb503cb06d8c688c)

## Closing & Next Steps

- **Ship demo:** Deploy to Monad testnet, pin sample MRV packages, and showcase mint → verify → retire in one session.
- **Improve attestations:** Add EAS or dedicated signature schemas for attestors; standardize MRV JSON.
- **Compliance hooks:** Optional allow-lists/KYC adapters for regulated contexts.
- **Analytics:** Stand up a lightweight indexer and a dashboard for batch inventory and retirement leaderboards.
- **Contributions welcome:** Open issues or submit a PR with focused improvements (tests, gas nudges, UX polish).

