import React, { useMemo, useState } from 'react';
import { useApp } from '../state/AppProvider.jsx';

export default function Liquidity() {
  const { tokens, wallet, status, callContract, parseUnits } = useApp();
  const [tokenA, setTokenA] = useState('');
  const [tokenB, setTokenB] = useState('');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');

  const tokenOptions = useMemo(() => tokens.map((token) => ({ value: token.address, label: `${token.symbol} — ${token.name}` })), [tokens]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!wallet.address) {
      alert('Connect wallet to continue.');
      return;
    }
    if (!tokenA || !tokenB || tokenA === tokenB) {
      alert('Select two different tokens.');
      return;
    }
    if (!amountA || !amountB) {
      alert('Enter token amounts.');
      return;
    }

    const metaA = tokens.find((token) => token.address === tokenA);
    const metaB = tokens.find((token) => token.address === tokenB);
    const amountADesired = parseUnits(amountA, metaA?.decimals ?? 18);
    const amountBDesired = parseUnits(amountB, metaB?.decimals ?? 18);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1800);

    await callContract('uniswapV2Router', 'addLiquidity', [
      tokenA,
      tokenB,
      amountADesired,
      amountBDesired,
      0n,
      0n,
      wallet.address,
      deadline
    ]);
  };

  return (
    <section className="rounded-3xl border border-monad-purple/25 bg-monad-black/70 p-8 shadow-xl backdrop-blur">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-semibold">Provide Liquidity</h3>
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

      <form onSubmit={handleSubmit} className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="tokenA" className="text-sm font-medium text-monad-offwhite/80">
            Token A
          </label>
          <select
            id="tokenA"
            value={tokenA}
            onChange={(event) => setTokenA(event.target.value)}
            className="w-full rounded-2xl border border-monad-purple/25 bg-black/30 px-4 py-3 text-sm text-monad-offwhite focus:border-monad-berry focus:outline-none"
          >
            <option value="" disabled>
              Select token
            </option>
            {tokenOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="tokenB" className="text-sm font-medium text-monad-offwhite/80">
            Token B
          </label>
          <select
            id="tokenB"
            value={tokenB}
            onChange={(event) => setTokenB(event.target.value)}
            className="w-full rounded-2xl border border-monad-purple/25 bg-black/30 px-4 py-3 text-sm text-monad-offwhite focus:border-monad-berry focus:outline-none"
          >
            <option value="" disabled>
              Select token
            </option>
            {tokenOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="amountA" className="text-sm font-medium text-monad-offwhite/80">
            Amount A
          </label>
          <input
            id="amountA"
            value={amountA}
            onChange={(event) => setAmountA(event.target.value)}
            type="number"
            min="0"
            placeholder="0.0"
            className="w-full rounded-2xl border border-monad-purple/25 bg-black/30 px-4 py-3 text-sm text-monad-offwhite placeholder:text-monad-offwhite/40 focus:border-monad-berry focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="amountB" className="text-sm font-medium text-monad-offwhite/80">
            Amount B
          </label>
          <input
            id="amountB"
            value={amountB}
            onChange={(event) => setAmountB(event.target.value)}
            type="number"
            min="0"
            placeholder="0.0"
            className="w-full rounded-2xl border border-monad-purple/25 bg-black/30 px-4 py-3 text-sm text-monad-offwhite placeholder:text-monad-offwhite/40 focus:border-monad-berry focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-monad-berry to-monad-purple px-4 py-3 text-center text-sm font-semibold shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!wallet.address}
          >
            {wallet.address ? 'Supply liquidity' : 'Connect wallet'}
          </button>
        </div>
      </form>

      {tokens.length === 0 && (
        <p className="mt-6 text-sm text-amber-300/80">
          Token list is empty. Populate `config/contracts.json` to enable liquidity provisioning.
        </p>
      )}
    </section>
  );
}
