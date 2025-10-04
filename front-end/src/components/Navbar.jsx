import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../state/AppProvider.jsx';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/swap', label: 'Swap' },
  { to: '/liquidity', label: 'Liquidity' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/admin', label: 'Admin' }
];

export default function Navbar() {
  const { status, connectWallet, wallet, config } = useApp();

  const linkBase =
    'rounded-xl border border-transparent px-3 py-1.5 text-sm transition hover:border-monad-berry/40 hover:bg-monad-berry/20 hover:text-monad-offwhite';
  const activeLink = `${linkBase} border border-monad-berry/40 bg-monad-berry/25 text-monad-offwhite`;

  return (
    <header className="flex flex-col gap-6 rounded-3xl border border-monad-purple/25 bg-[linear-gradient(140deg,rgba(16,4,40,0.82),rgba(14,16,15,0.82))] px-6 py-5 shadow-xl backdrop-blur lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-monad-berry to-monad-purple text-lg font-bold">
          CB
        </div>
        <div>
          <h1 className="text-xl font-semibold">CarbonBlitz</h1>
          <p className="text-sm text-monad-offwhite/70">Monad-native RWA liquidity hub</p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-3 text-sm text-monad-offwhite/70">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => (isActive ? activeLink : linkBase)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          className="rounded-full border border-monad-purple/30 bg-monad-blue/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-monad-offwhite/80"
        >
          {config?.network?.name ?? 'Network' }
        </button>
        <button
          type="button"
          onClick={connectWallet}
          className="rounded-full bg-gradient-to-r from-monad-berry to-monad-purple px-5 py-2 text-sm font-semibold shadow-glow transition hover:opacity-90"
        >
          {wallet.address ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}` : 'Connect Wallet'}
        </button>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
            status.connected
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
          }`}
        >
          {status.message}
        </span>
      </div>
    </header>
  );
}
