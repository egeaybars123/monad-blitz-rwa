import React, { useState } from 'react';
import { useApp } from '../state/AppProvider.jsx';

export default function Admin() {
  const { wallet, status, callContract, parseUnits, tokens } = useApp();
  const [deviceAddress, setDeviceAddress] = useState('');
  const [batchAddresses, setBatchAddresses] = useState('');
  const [mintForm, setMintForm] = useState({ to: '', amount: '', device: '', signature: '' });

  const handleWhitelist = async (event) => {
    event.preventDefault();
    if (!wallet.isAdmin) {
      alert('Admin wallet required.');
      return;
    }
    await callContract('carbonBlitz', 'whitelistSmartDevice', [deviceAddress]);
    setDeviceAddress('');
  };

  const handleBatch = async (event) => {
    event.preventDefault();
    if (!wallet.isAdmin) {
      alert('Admin wallet required.');
      return;
    }
    const addresses = batchAddresses
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!addresses.length) {
      alert('Provide at least one address.');
      return;
    }
    await callContract('carbonBlitz', 'whitelistBatchSmartDevices', [addresses]);
    setBatchAddresses('');
  };

  const handleMint = async (event) => {
    event.preventDefault();
    if (!wallet.isAdmin) {
      alert('Admin wallet required.');
      return;
    }
    const decimals = tokens.find((token) => token.symbol === 'CBLTZ')?.decimals ?? 18;
    const parsedAmount = parseUnits(mintForm.amount || '0', decimals);
    await callContract('carbonBlitz', 'mint', [mintForm.to, parsedAmount, mintForm.device, mintForm.signature]);
    setMintForm({ to: '', amount: '', device: '', signature: '' });
  };

  return (
    <section className="rounded-3xl border border-monad-purple/25 bg-monad-black/70 p-8 shadow-xl backdrop-blur">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-semibold">Admin Console</h3>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
            wallet.isAdmin
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
          }`}
        >
          {wallet.isAdmin ? 'Admin' : status.message}
        </span>
      </header>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/12 bg-black/30 p-6 shadow">
          <h4 className="text-lg font-semibold">Whitelist Smart Device</h4>
          <form onSubmit={handleWhitelist} className="mt-4 space-y-4">
            <label className="text-sm text-monad-offwhite/70" htmlFor="device-address">
              Device public key
            </label>
            <input
              id="device-address"
              value={deviceAddress}
              onChange={(event) => setDeviceAddress(event.target.value)}
              type="text"
              placeholder="0x..."
              required
              className="w-full rounded-2xl border border-monad-purple/25 bg-black/40 px-4 py-3 text-sm text-monad-offwhite placeholder:text-monad-offwhite/40 focus:border-monad-berry focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-monad-berry to-monad-purple px-4 py-2 text-sm font-semibold shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!wallet.isAdmin}
            >
              {wallet.isAdmin ? 'Whitelist device' : 'Connect admin wallet'}
            </button>
          </form>
          <p className="mt-4 text-xs text-monad-offwhite/60">
            Approved device keys can submit signed telemetry for carbon issuance.
          </p>
        </div>

        <div className="rounded-2xl border border-white/12 bg-black/30 p-6 shadow">
          <h4 className="text-lg font-semibold">Batch Whitelist</h4>
          <form onSubmit={handleBatch} className="mt-4 space-y-4">
            <label className="text-sm text-monad-offwhite/70" htmlFor="batch-addresses">
              Paste device addresses (one per line)
            </label>
            <textarea
              id="batch-addresses"
              value={batchAddresses}
              onChange={(event) => setBatchAddresses(event.target.value)}
              rows="5"
              placeholder="0xabc...\n0xdef..."
              required
              className="w-full rounded-2xl border border-monad-purple/25 bg-black/40 px-4 py-3 text-sm text-monad-offwhite placeholder:text-monad-offwhite/40 focus:border-monad-berry focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-full border border-monad-purple/40 bg-monad-blue/60 px-4 py-2 text-sm font-semibold transition hover:border-monad-berry/40 hover:bg-monad-berry/30 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!wallet.isAdmin}
            >
              {wallet.isAdmin ? 'Batch whitelist' : 'Connect admin wallet'}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-white/12 bg-black/30 p-6 shadow xl:col-span-1 md:col-span-2">
          <h4 className="text-lg font-semibold">Mint Carbon Credits</h4>
          <form onSubmit={handleMint} className="mt-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-monad-offwhite/70" htmlFor="mint-to">
                Recipient
              </label>
              <input
                id="mint-to"
                value={mintForm.to}
                onChange={(event) => setMintForm((prev) => ({ ...prev, to: event.target.value }))}
                type="text"
                placeholder="0x..."
                required
                className="w-full rounded-2xl border border-monad-purple/25 bg-black/40 px-4 py-3 text-sm text-monad-offwhite placeholder:text-monad-offwhite/40 focus:border-monad-berry focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-monad-offwhite/70" htmlFor="mint-amount">
                Amount
              </label>
              <input
                id="mint-amount"
                value={mintForm.amount}
                onChange={(event) => setMintForm((prev) => ({ ...prev, amount: event.target.value }))}
                type="number"
                min="0"
                step="0.01"
                required
                className="w-full rounded-2xl border border-monad-purple/25 bg-black/40 px-4 py-3 text-sm text-monad-offwhite placeholder:text-monad-offwhite/40 focus:border-monad-berry focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-monad-offwhite/70" htmlFor="mint-device">
                Smart device
              </label>
              <input
                id="mint-device"
                value={mintForm.device}
                onChange={(event) => setMintForm((prev) => ({ ...prev, device: event.target.value }))}
                type="text"
                placeholder="0x..."
                required
                className="w-full rounded-2xl border border-monad-purple/25 bg-black/40 px-4 py-3 text-sm text-monad-offwhite placeholder:text-monad-offwhite/40 focus:border-monad-berry focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-monad-offwhite/70" htmlFor="mint-signature">
                ECDSA signature
              </label>
              <textarea
                id="mint-signature"
                value={mintForm.signature}
                onChange={(event) => setMintForm((prev) => ({ ...prev, signature: event.target.value }))}
                rows="2"
                placeholder="0xsignature"
                required
                className="w-full rounded-2xl border border-monad-purple/25 bg-black/40 px-4 py-3 text-sm text-monad-offwhite placeholder:text-monad-offwhite/40 focus:border-monad-berry focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-monad-berry to-monad-purple px-4 py-2 text-sm font-semibold shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!wallet.isAdmin}
            >
              {wallet.isAdmin ? 'Mint tokens' : 'Connect admin wallet'}
            </button>
          </form>
          <p className="mt-4 text-xs text-monad-offwhite/60">
            Signatures must be produced via `hashMintPayload` and verified on-chain.
          </p>
        </div>
      </div>
    </section>
  );
}
