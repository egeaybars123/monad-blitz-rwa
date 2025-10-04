import React from 'react';
import { useApp } from '../state/AppProvider.jsx';

export default function Analytics() {
  const { metrics, status } = useApp();

  const cards = [
    { title: 'Last Device Sync', value: metrics.lastDeviceSync },
    { title: 'Devices Whitelisted', value: metrics.deviceCount },
    { title: 'Pending Mints', value: metrics.pendingMints },
    { title: 'Energy Processed', value: metrics.energyProcessed }
  ];

  return (
    <section className="rounded-3xl border border-monad-purple/25 bg-monad-black/70 p-8 shadow-xl backdrop-blur">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-semibold">Carbon Analytics</h3>
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

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow">
            <h4 className="text-sm font-semibold text-monad-offwhite/70">{card.title}</h4>
            <p className="mt-2 text-xl font-semibold">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
