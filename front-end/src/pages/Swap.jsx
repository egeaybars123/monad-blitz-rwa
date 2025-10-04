import React, { useMemo, useState } from 'react';
import { useApp } from '../state/AppProvider.jsx';

export default function Swap() {
  const {
    tokens,
    selectedTokens,
    updateSelectedTokens,
    openTokenDrawer,
    wallet,
    status,
    callContract,
    parseUnits
  } = useApp();
  const [payAmount, setPayAmount] = useState('');
  const [priceImpact] = useState('--');

  const routeText = useMemo(() => {
    if (!selectedTokens.pay || !selectedTokens.receive) return '--';
    return `${selectedTokens.pay.symbol} → ${selectedTokens.receive.symbol}`;
  }, [selectedTokens]);

  const handleSwitch = () => {
    updateSelectedTokens(({ pay, receive }) => ({ pay: receive, receive: pay }));
  };

  const handleTokenPick = (slot) => {
    openTokenDrawer(`Select ${slot === 'pay' ? 'pay' : 'receive'} token`, (token) => {
      updateSelectedTokens((current) => ({
        ...current,
        [slot]: token
      }));
    });
  };

  const handleSwap = async () => {
    if (!wallet.address) {
      alert('Connect wallet to continue.');
      return;
    }
    if (!selectedTokens.pay || !selectedTokens.receive) {
      alert('Select both tokens first.');
      return;
    }
    if (!payAmount || Number(payAmount) <= 0) {
      alert('Enter an amount to pay.');
      return;
    }

    const amountIn = parseUnits(payAmount, selectedTokens.pay.decimals ?? 18);
    const path = [selectedTokens.pay.address, selectedTokens.receive.address];
    const minAmountOut = 0n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

    await callContract('uniswapV2Router', 'swapExactTokensForTokens', [
      amountIn,
      minAmountOut,
      path,
      wallet.address,
      deadline
    ]);
  };

  return (
    <section className="rounded-3xl border border-monad-purple/25 bg-monad-black/70 p-8 shadow-xl backdrop-blur">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-semibold">Swap</h3>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
            status.connected
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
          }`}
        >
          {status.message}
        </span>
      </header>

      <div className="mt-8 space-y-6 rounded-3xl border border-monad-purple/25 bg-[linear-gradient(160deg,rgba(14,16,15,0.92),rgba(32,0,82,0.55))] p-6 shadow-lg">
        <div className="space-y-2">
          <label className="text-sm font-medium text-monad-offwhite/80">Pay</label>
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
            <input
              value={payAmount}
              onChange={(event) => setPayAmount(event.target.value)}
              type="number"
              min="0"
              placeholder="0.0"
              className="w-full bg-transparent text-2xl font-semibold text-monad-offwhite placeholder:text-monad-offwhite/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleTokenPick('pay')}
              className="rounded-xl border border-monad-purple/30 bg-monad-blue/70 px-4 py-2 text-sm font-semibold transition hover:border-monad-berry/40 hover:bg-monad-berry/30"
            >
              {selectedTokens.pay?.symbol ?? 'Select'}
            </button>
          </div>
          <span className="text-xs text-monad-offwhite/50">Balance: --</span>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwitch}
            className="rounded-full border border-white/10 bg-white/10 p-3 text-lg transition hover:border-monad-berry/40 hover:bg-monad-berry/25"
            aria-label="Switch pair"
          >
            ⇅
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-monad-offwhite/80">Receive</label>
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
            <input
              type="text"
              readOnly
              placeholder="0.0"
              className="w-full bg-transparent text-2xl font-semibold text-monad-offwhite placeholder:text-monad-offwhite/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleTokenPick('receive')}
              className="rounded-xl border border-monad-purple/30 bg-monad-blue/70 px-4 py-2 text-sm font-semibold transition hover:border-monad-berry/40 hover:bg-monad-berry/30"
            >
              {selectedTokens.receive?.symbol ?? 'Select'}
            </button>
          </div>
          <span className="text-xs text-monad-offwhite/50">Price impact: {priceImpact}</span>
        </div>

        <button
          type="button"
          onClick={handleSwap}
          className="w-full rounded-full bg-gradient-to-r from-monad-berry to-monad-purple px-4 py-3 text-center text-sm font-semibold shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!wallet.address}
        >
          {wallet.address ? 'Swap' : 'Connect wallet'}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-monad-offwhite/60">
          <div className="space-y-1">
            <span className="uppercase tracking-[0.3em]">Pool price</span>
            <span className="block text-sm font-semibold text-monad-offwhite">--</span>
          </div>
          <div className="space-y-1">
            <span className="uppercase tracking-[0.3em]">Route</span>
            <span className="block text-sm font-semibold text-monad-offwhite">{routeText}</span>
          </div>
        </div>
      </div>

      {tokens.length === 0 && (
        <p className="mt-6 text-sm text-amber-300/80">
          Token list is empty. Populate `config/contracts.json` to enable swapping.
        </p>
      )}
    </section>
  );
}
