import React, { useMemo } from 'react';
import { useApp } from '../state/AppProvider.jsx';

export default function TokenDrawer() {
  const { drawerState, closeTokenDrawer, selectToken, tokens } = useApp();

  const excludeSet = useMemo(() => {
    return new Set(
      (drawerState.exclude ?? [])
        .filter(Boolean)
        .map((address) => address.toLowerCase())
    );
  }, [drawerState.exclude]);

  const sortedTokens = useMemo(
    () =>
      tokens
        .filter((token) => !excludeSet.has(token.address.toLowerCase()))
        .slice()
        .sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [excludeSet, tokens]
  );

  if (!drawerState.open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0b0b0b]/35 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-md border-2 border-xpGray bg-white shadow-[0_20px_80px_rgba(0,0,0,0.25)]">
        <header className="flex items-center justify-between bg-gradient-to-r from-xpBlueDark via-xpBlue to-xpBlueLight px-4 py-2 text-sm font-semibold text-white">
          <h4>{drawerState.title}</h4>
          <button
            type="button"
            onClick={closeTokenDrawer}
            className="flex h-6 w-6 items-center justify-center rounded-sm border border-white/40 bg-white/30 text-base leading-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)] transition hover:bg-white/40"
          >
            ×
          </button>
        </header>
        <div className="max-h-72 space-y-2 overflow-y-auto bg-gradient-to-br from-white via-xpCream to-[#e3e3e3] px-4 py-4 pr-3 text-[#1b1b1b]">
          {sortedTokens.length === 0 && (
            <p className="rounded border border-dashed border-[#9aa6c5] bg-white/80 px-4 py-3 text-center text-[12px] text-[#4b4b4b]">
              No tokens available for this selection.
            </p>
          )}
          {sortedTokens.map((token) => (
            <button
              key={token.address}
              type="button"
              onClick={() => selectToken(token)}
              className="flex w-full items-center justify-between rounded border border-[#d0d7ea] bg-white/90 px-3 py-2 text-left text-[12px] font-semibold text-[#0c3a94] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:border-[#1c62d1] hover:bg-[#e6f0ff]"
            >
              <span className="flex flex-col leading-tight">
                <span className="text-[13px]">{token.symbol}</span>
                <span className="text-[11px] font-normal text-[#4b4b4b]">{token.name}</span>
              </span>
              <span className="text-[11px] font-normal text-[#4b4b4b]">{token.address.slice(0, 6)}…{token.address.slice(-4)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
