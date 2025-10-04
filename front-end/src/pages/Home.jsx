import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../state/AppProvider.jsx';

const modules = [
  {
    title: 'Swap Engine',
    copy: 'Route USDC ↔︎ CBLTZ with oracle-backed slippage controls.',
    href: '/swap'
  },
  {
    title: 'Liquidity Studio',
    copy: 'Bootstrap RWAvangers pools and earn climate-aligned yield.',
    href: '/liquidity'
  },
  {
    title: 'Telemetry Analytics',
    copy: 'Audit device feeds, issuance queues, and supply cadence.',
    href: '/analytics'
  },
  {
    title: 'Admin Ops',
    copy: 'Whitelist devices and orchestrate verified carbon mints.',
    href: '/admin'
  }
];

const highlights = [
  { label: 'Impact Chains', detail: 'Device-signed proofs anchor every issuance.' },
  { label: 'Composable Markets', detail: 'Plug liquidity into Monad-native RWA protocols.' },
  { label: 'Community Operated', detail: 'RWAvangers stewards upgrades and emergency tooling.' }
];

export default function Home() {
  const { status, metrics } = useApp();

  return (
    <div className="space-y-24">
      <section className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-10">
          <span className="inline-flex items-center rounded-full bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
            RWAvangers · CarbonBlitz
          </span>
          <h2 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
            Monad-native liquidity for verifiable climate impact.
          </h2>
          <p className="max-w-2xl text-lg text-white/70">
            CarbonBlitz transforms high-fidelity device telemetry into programmable carbon liquidity. The RWAvangers
            collective coordinates swaps, vaults, and issuance workflows with transparent on-chain guarantees.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/swap"
              className="rounded-full bg-gradient-to-r from-[#836EF9] to-[#A0055D] px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-lg shadow-[#836EF9]/40 transition hover:brightness-110"
            >
              Launch Swap
            </Link>
            <Link
              to="/analytics"
              className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:text-white"
            >
              View Analytics
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Network</p>
              <p className="mt-3 text-2xl font-semibold text-white">Monad Testnet</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Wallet State</p>
              <p className="mt-3 text-2xl font-semibold text-white">{status.message}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">CBLTZ Supply</p>
              <p className="mt-3 text-2xl font-semibold text-white">{metrics.supply}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-white/60">Impact Feed</span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] ${
              status.connected ? 'bg-emerald-400/20 text-emerald-200' : 'bg-rose-400/20 text-rose-200'
            }`}
            >
              {status.connected ? 'Live' : 'Offline'}
            </span>
          </div>
          <div className="space-y-6">
            {highlights.map((item) => (
              <article key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white">{item.label}</h3>
                <p className="mt-3 text-sm text-white/70">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-10">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">Product Suite</p>
          <h3 className="text-3xl font-semibold text-white">Everything you need to run climate-positive liquidity.</h3>
          <p className="max-w-2xl text-sm text-white/70">
            Each module is designed to feel cinematic yet responsive—mirroring Monad’s performance while staying grounded
            in transparent carbon accounting.
          </p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {modules.map((module) => (
            <Link
              key={module.title}
              to={module.href}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-8 backdrop-blur-lg transition hover:border-white/30"
            >
              <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,#836EF9_0%,rgba(131,110,249,0)_70%)] opacity-40 transition group-hover:scale-110" />
              <div className="relative space-y-4">
                <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-white">
                  {module.title}
                </span>
                <p className="text-base text-white/75">{module.copy}</p>
                <span className="inline-flex items-center text-sm font-semibold text-white transition group-hover:tracking-[0.2em]">
                  Enter →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
