import React from 'react';
import XPWindow from '../components/XPWindow.jsx';
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
    <XPWindow
      title="Analytics Monitor"
      icon="/logo/monad_rwa_logo.png"
      bodyClassName="p-0"
      footer={`Status: ${status.message}`}
    >
      <div className="space-y-4 p-6">
        <div className="rounded border border-xpGray bg-white/95 p-4 text-[12px] text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <h3 className="text-[14px] font-semibold text-[#0c3a94]">Telemetry Overview</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className="rounded border border-[#d0d7ea] bg-white/90 px-4 py-3 text-[12px] text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            >
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]">{card.title}</h4>
              <p className="mt-2 text-lg font-semibold text-[#1b1b1b]">{card.value}</p>
            </article>
          ))}
        </div>
      </div>
    </XPWindow>
  );
}
