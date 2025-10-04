import React, { useState } from 'react';
import XPWindow from '../components/XPWindow.jsx';
import { useApp } from '../state/AppProvider.jsx';

export default function Admin() {
  const { wallet, callContract, parseUnits, tokens, showDialog } = useApp();
  const [deviceAddress, setDeviceAddress] = useState('');
  const [batchAddresses, setBatchAddresses] = useState('');
  const [mintForm, setMintForm] = useState({ to: '', amount: '', device: '', signature: '' });

  const handleWhitelist = async (event) => {
    event.preventDefault();
    if (!wallet.isAdmin) {
      showDialog({ title: 'Admin required', message: 'Only admin wallets can whitelist devices.' });
      return;
    }
    await callContract('carbonBlitz', 'whitelistSmartDevice', [deviceAddress]);
    setDeviceAddress('');
  };

  const handleBatch = async (event) => {
    event.preventDefault();
    if (!wallet.isAdmin) {
      showDialog({ title: 'Admin required', message: 'Only admin wallets can whitelist devices.' });
      return;
    }
    const addresses = batchAddresses
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!addresses.length) {
      showDialog({ title: 'Addresses required', message: 'Provide at least one device address.' });
      return;
    }
    await callContract('carbonBlitz', 'whitelistBatchSmartDevices', [addresses]);
    setBatchAddresses('');
  };

  const handleMint = async (event) => {
    event.preventDefault();
    if (!wallet.isAdmin) {
      showDialog({ title: 'Admin required', message: 'Only admin wallets can mint tokens.' });
      return;
    }
    const decimals = tokens.find((token) => token.symbol === 'CBLTZ')?.decimals ?? 18;
    const parsedAmount = parseUnits(mintForm.amount || '0', decimals);
    await callContract('carbonBlitz', 'mint', [mintForm.to, parsedAmount, mintForm.device, mintForm.signature]);
    setMintForm({ to: '', amount: '', device: '', signature: '' });
  };

  return (
    <XPWindow
      title="Admin Console"
      icon="/logo/monad_rwa_logo.png"
      bodyClassName="p-0"
      footer={`Admin rights: ${wallet.isAdmin ? 'granted' : 'wallet locked'}`}
    >
      <div className="space-y-4 p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded border border-xpGray bg-white/95 p-4 text-[12px] text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <h4 className="text-[14px] font-semibold text-[#0c3a94]">Whitelist smart device</h4>
            <form onSubmit={handleWhitelist} className="mt-3 space-y-3">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]" htmlFor="device-address">
                Device public key
              </label>
              <input
                id="device-address"
                value={deviceAddress}
                onChange={(event) => setDeviceAddress(event.target.value)}
                type="text"
                placeholder="0x..."
                required
                className="w-full rounded border border-[#7b7b7b] bg-white px-3 py-2 text-sm text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#245edb] focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded border border-[#0b3b9e] bg-gradient-to-b from-[#5099ff] to-[#1c62d1] px-3 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!wallet.isAdmin}
              >
                {wallet.isAdmin ? 'Whitelist device' : 'Admin required'}
              </button>
            </form>
          </div>

          <div className="rounded border border-xpGray bg-white/95 p-4 text-[12px] text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <h4 className="text-[14px] font-semibold text-[#0c3a94]">Batch whitelist</h4>
            <form onSubmit={handleBatch} className="mt-3 space-y-3">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]" htmlFor="batch-addresses">
                One address per line
              </label>
              <textarea
                id="batch-addresses"
                value={batchAddresses}
                onChange={(event) => setBatchAddresses(event.target.value)}
                rows="6"
                placeholder="0xabc...\n0xdef..."
                required
                className="w-full rounded border border-[#7b7b7b] bg-white px-3 py-2 text-sm text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#245edb] focus:outline-none"
              />
              <button
                type="submit"
                className="w-full rounded border border-[#0b3b9e] bg-gradient-to-b from-[#5099ff] to-[#1c62d1] px-3 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!wallet.isAdmin}
              >
                {wallet.isAdmin ? 'Batch whitelist' : 'Admin required'}
              </button>
            </form>
          </div>

          <div className="rounded border border-xpGray bg-white/95 p-4 text-[12px] text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] lg:col-span-1 md:col-span-2">
            <h4 className="text-[14px] font-semibold text-[#0c3a94]">Mint carbon credits</h4>
            <form onSubmit={handleMint} className="mt-3 space-y-3">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]" htmlFor="mint-to">
                  Recipient
                </label>
                <input
                  id="mint-to"
                  value={mintForm.to}
                  onChange={(event) => setMintForm((prev) => ({ ...prev, to: event.target.value }))}
                  type="text"
                  placeholder="0x..."
                  required
                  className="w-full rounded border border-[#7b7b7b] bg-white px-3 py-2 text-sm text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#245edb] focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]" htmlFor="mint-amount">
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
                  className="w-full rounded border border-[#7b7b7b] bg-white px-3 py-2 text-sm text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#245edb] focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]" htmlFor="mint-device">
                  Smart device
                </label>
                <input
                  id="mint-device"
                  value={mintForm.device}
                  onChange={(event) => setMintForm((prev) => ({ ...prev, device: event.target.value }))}
                  type="text"
                  placeholder="0x..."
                  required
                  className="w-full rounded border border-[#7b7b7b] bg-white px-3 py-2 text-sm text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#245edb] focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]" htmlFor="mint-signature">
                  ECDSA signature
                </label>
                <textarea
                  id="mint-signature"
                  value={mintForm.signature}
                  onChange={(event) => setMintForm((prev) => ({ ...prev, signature: event.target.value }))}
                  rows="3"
                  placeholder="0xsignature"
                  required
                  className="w-full rounded border border-[#7b7b7b] bg-white px-3 py-2 text-sm text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#245edb] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded border border-[#0b3b9e] bg-gradient-to-b from-[#5099ff] to-[#1c62d1] px-3 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={!wallet.isAdmin}
              >
                {wallet.isAdmin ? 'Mint tokens' : 'Admin required'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </XPWindow>
  );
}
