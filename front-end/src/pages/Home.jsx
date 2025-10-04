import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state/AppProvider.jsx';

const cards = [
  {
    title: 'Swap',
    description: 'Swap between USDC and CBLTZ with direct pair execution.',
    href: '/swap',
    cta: 'Go to swap'
  },
  {
    title: 'Liquidity',
    description: 'Provide dual-sided liquidity to amplify RWA-backed markets.',
    href: '/liquidity',
    cta: 'Manage liquidity'
  },
  {
    title: 'Analytics',
    description: 'Monitor smart device telemetry, issuance queues, and on-chain supply.',
    href: '/analytics',
    cta: 'View analytics'
  },
  {
    title: 'Admin',
    description: 'Whitelist devices and operate carbon issuance workflows.',
    href: '/admin',
    cta: 'Open admin'
  }
];

export default function Home() {
  const { status, metrics } = useApp();

  return (
    <div className="flex flex-col gap-10">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center gap-6">
          <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
            Blend liquidity with real-world energy intelligence.
          </h2>
          <p className="max-w-xl text-base text-monad-offwhite/70">
            CarbonBlitz syncs smart device telemetry with Monad-native AMMs to issue verifiable carbon credits and deep
            liquidity for USDC-backed markets.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/swap"
              className="rounded-full border border-monad-purple/30 bg-white/10 px-6 py-2 text-sm font-semibold text-monad-offwhite transition hover:border-monad-berry/40 hover:bg-monad-berry/20"
            >
              Launch App
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-monad-purple/20 bg-[linear-gradient(160deg,rgba(32,0,82,0.75),rgba(14,16,15,0.9))] p-6 shadow-xl">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-monad-offwhite/60">
            <span>Status</span>
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
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-monad-offwhite/50">CBLTZ Supply</p>
            <p className="mt-3 text-4xl font-semibold">{metrics.supply}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-monad-purple/25 bg-monad-blue/40 p-8 shadow-lg backdrop-blur">
        <header className="flex flex-col gap-2 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold">Monad-first liquidity and carbon issuance</h3>
          <span className="rounded-full border border-monad-purple/30 bg-monad-berry/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-monad-offwhite/80">
            Start
          </span>
        </header>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-monad-purple/25 bg-monad-black/70 p-5 shadow-lg">
              <h4 className="text-lg font-semibold">{card.title}</h4>
              <p className="mt-2 text-sm text-monad-offwhite/65">{card.description}</p>
              <Link
                to={card.href}
                className="mt-6 inline-flex items-center rounded-full bg-gradient-to-r from-monad-berry to-monad-purple px-4 py-2 text-sm font-semibold shadow-glow transition hover:opacity-90"
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
