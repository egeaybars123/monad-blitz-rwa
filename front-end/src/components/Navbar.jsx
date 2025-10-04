import React from 'react';

export default function Navbar({
  navItems,
  activePath,
  onNavClick,
  startOpen,
  onToggleStart,
  wallet,
  connectWallet,
  metrics,
  timeString,
  dateString
}) {
  const isConnected = Boolean(wallet.address);
  const cbltzSupply = metrics?.supply ?? '--';

  return (
    <footer className="relative z-30 flex h-14 w-full items-center gap-3 border-t-2 border-[#0a2e78]/70 bg-gradient-to-t from-[#07246a]/95 via-[#164dac]/95 to-[#3d87e5]/95 px-2 text-white shadow-[0_-2px_8px_rgba(0,0,0,0.45)]">
      <button
        type="button"
        onClick={onToggleStart}
        className={`flex h-10 items-center gap-2 rounded-full border border-[#0a3b83] bg-gradient-to-r from-[#2da94f] via-[#38c45c] to-[#54e269] px-3 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:brightness-110 ${
          startOpen ? 'translate-y-px shadow-inner' : ''
        }`}
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/30">
          <img src="/logo/monad_rwa_logo.png" alt="Start" className="h-4 w-4" />
        </span>
        Start
      </button>

      <nav className="flex flex-1 items-center gap-2 px-2">
        {navItems.map((item) => {
          const isActive = activePath === item.to || (item.to === '/swap' && activePath === '/');
          return (
            <button
              key={item.to}
              type="button"
              onClick={() => onNavClick(item.to)}
              className={`flex h-10 min-w-[110px] items-center justify-start gap-2 rounded-sm border border-[#0a3f9b]/40 bg-[#134b9c]/40 px-3 text-left text-[12px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition ${
                isActive ? 'bg-[#e6f0ff]/90 text-[#0c3a94]' : 'text-white/90 hover:bg-[#2461c7]/70'
              } ${isConnected ? '' : 'cursor-not-allowed opacity-70'}`}
              disabled={!isConnected}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-white/30 bg-white/30 text-[10px] font-bold text-[#0c3a94]">
                {item.label.charAt(0)}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 text-[12px]">
        <span className="rounded-sm border border-white/30 bg-[#0b3b9e]/60 px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          CBLTZ: {cbltzSupply}
        </span>
        <button
          type="button"
          onClick={() => {
            if (!isConnected) connectWallet();
          }}
          className={`min-w-[150px] rounded-sm border border-white/30 bg-gradient-to-b from-[#498aff] to-[#1c62d1] px-3 py-1 text-[11px] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition ${
            isConnected ? 'cursor-default text-white' : 'hover:brightness-110'
          }`}
          disabled={isConnected}
          title={isConnected ? 'Connected — manage wallet from Start menu' : 'Connect wallet'}
        >
          {isConnected ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}` : 'Connect Wallet'}
        </button>
        <div className="flex flex-col items-end rounded-sm border border-white/30 bg-[#0b3b9e]/50 px-2 py-1 text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <span className="font-semibold">{timeString}</span>
          <span className="text-white/80">{dateString}</span>
        </div>
      </div>
    </footer>
  );
}
