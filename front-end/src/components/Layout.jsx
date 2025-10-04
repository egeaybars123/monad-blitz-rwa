import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import TokenDrawer from './TokenDrawer.jsx';
import XPWindow from './XPWindow.jsx';
import XPDialog from './XPDialog.jsx';
import { useApp } from '../state/AppProvider.jsx';

const NAV_ITEMS = [
  { to: '/swap', label: 'Swap' },
  { to: '/liquidity', label: 'Liquidity' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/admin', label: 'Admin' }
];

export default function Layout({ children }) {
  const { wallet, connectWallet, disconnectWallet, metrics, dialog, hideDialog } = useApp();
  const isConnected = Boolean(wallet.address);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState(() => new Date());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setStartOpen(false);
  }, [location.pathname]);

  const timeString = useMemo(
    () => clock.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    [clock]
  );

  const dateString = useMemo(
    () => clock.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }),
    [clock]
  );

  const handleOpenApp = (path) => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    navigate(path);
  };

  const handleToggleStart = () => {
    setStartOpen((prev) => !prev);
  };

  const handleCloseStart = () => {
    setStartOpen(false);
  };

  const welcomeWindow = (
    <XPWindow
      title="CarbonBlitz XP"
      icon="/logo/monad_rwa_logo.png"
      className="max-w-md"
      footer="Tip: Use the Start button to explore apps once connected."
    >
      <div className="space-y-4 text-[14px] text-[#1b1b1b]">
        <p className="text-[16px] font-semibold text-[#103c9c]">Connect your wallet to open the computer.</p>
        <p>
          This desktop unlocks the CarbonBlitz toolset. Secure your wallet connection to continue.
        </p>
        <button
          type="button"
          onClick={connectWallet}
          className="inline-flex w-full items-center justify-center gap-2 rounded border border-[#0b3b9e] bg-gradient-to-b from-[#4da0ff] to-[#1c62d1] px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:brightness-110"
        >
          Connect Wallet
        </button>
      </div>
    </XPWindow>
  );

  return (
    <div className="relative flex h-screen flex-col overflow-hidden font-xp text-[#1b1b1b]">
      <main className="relative z-20 flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex w-full items-center justify-center">
          {isConnected ? children : welcomeWindow}
        </div>
      </main>

      <Navbar
        navItems={NAV_ITEMS}
        activePath={location.pathname}
        onNavClick={handleOpenApp}
        startOpen={startOpen}
        onToggleStart={handleToggleStart}
        wallet={wallet}
        connectWallet={connectWallet}
        metrics={metrics}
        timeString={timeString}
        dateString={dateString}
      />

      {startOpen && (
        <>
          <button
            type="button"
            aria-label="Close start menu"
            onClick={handleCloseStart}
            className="absolute inset-0 z-40"
          />
          <StartMenu
            navItems={NAV_ITEMS}
            onSelect={handleOpenApp}
            wallet={wallet}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />
        </>
      )}

      <TokenDrawer />

      {dialog?.open && (
        <XPDialog
          title={dialog.title}
          message={dialog.message}
          detail={dialog.detail}
          linkHref={dialog.linkHref}
          linkLabel={dialog.linkLabel}
          onClose={hideDialog}
        />
      )}
    </div>
  );
}

function StartMenu({ navItems, onSelect, wallet, onConnect, onDisconnect }) {
  const isConnected = Boolean(wallet.address);

  return (
    <div className="absolute bottom-16 left-2 z-50 flex w-72 overflow-hidden rounded-md border-2 border-xpBlueDark bg-[#f6faff]/95 shadow-xpRaised">
      <aside className="flex w-12 flex-col items-center justify-end bg-gradient-to-b from-xpBlue to-xpBlueDark pb-4 pt-10 text-white">
        <img
          src="/logo/monad_rwa_logo.png"
          alt="CarbonBlitz logo"
          className="h-10 w-10 rounded-full border border-white/40 bg-white/30 object-contain p-1"
        />
        <span className="mt-3 rotate-90 text-[11px] tracking-[0.3em] text-white/80">CarbonBlitz</span>
      </aside>

      <div className="flex-1 bg-[#f6faff]/96 p-3 text-[12px] text-[#1b1b1b]">
        <div className="mb-3 flex items-center gap-2 rounded bg-white/80 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <div className="h-10 w-10 overflow-hidden rounded-sm border border-xpBlue/40 bg-white">
            <img src="/logo/monad_rwa_logo.png" alt="Avatar" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#103c9c]">CarbonBlitz XP</p>
            <p className="text-[11px] text-[#245edb]/80">{isConnected ? 'Welcome back' : 'Wallet locked'}</p>
          </div>
        </div>

        <div className="space-y-1">
          {navItems.map((item) => {
            const disabled = !isConnected;
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => (disabled ? onConnect() : onSelect(item.to))}
                className={`flex w-full items-center justify-between rounded-sm border border-transparent bg-white/80 px-3 py-2 text-left text-[12px] transition hover:border-xpBlue hover:bg-[#e6f0ff] ${
                  disabled ? 'cursor-not-allowed opacity-70' : ''
                }`}
              >
                <span className="font-semibold text-[#103c9c]">{item.label}</span>
                <span className="text-[10px] text-[#4b4b4b]">App</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-sm border border-white/60 bg-white/70 px-2 py-2 text-[11px] text-[#103c9c]">
          <p className="font-semibold">Wallet</p>
          <p className="truncate text-[#1b1b1b]">
            {isConnected ? `${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)}` : 'Not connected'}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={isConnected ? onDisconnect : onConnect}
            className="rounded-sm border border-[#0b3b9e]/60 bg-gradient-to-b from-[#5ba4ff] to-[#1c62d1] px-3 py-2 text-[11px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:brightness-110"
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
          <button
            type="button"
            onClick={() => window.open('https://windowsxp.com', '_blank')}
            className="rounded-sm border border-[#0b3b9e]/20 bg-white/80 px-3 py-2 text-[11px] font-semibold text-[#103c9c] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:bg-[#e6f0ff]"
          >
            Help
          </button>
        </div>
      </div>
    </div>
  );
}
