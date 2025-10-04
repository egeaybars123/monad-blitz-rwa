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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-5 backdrop-blur">
      <div className="w-full max-w-lg space-y-4 rounded-3xl border border-monad-purple/40 bg-monad-black/95 p-6 shadow-2xl">
        <header className="flex items-center justify-between text-sm font-semibold">
          <h4>{drawerState.title}</h4>
          <button
            type="button"
            onClick={closeTokenDrawer}
            className="rounded-full bg-white/10 px-3 py-1 text-lg leading-none"
          >
            ×
          </button>
        </header>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {sortedTokens.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-center text-xs text-monad-offwhite/60">
              No tokens available for this selection.
            </p>
          )}
          {sortedTokens.map((token) => (
            <button
              key={token.address}
              type="button"
              onClick={() => selectToken(token)}
              className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-transparent bg-white/5 px-4 py-3 text-left text-sm transition hover:border-monad-purple/40 hover:bg-monad-berry/15"
            >
              <div>
                <strong className="block text-base">{token.symbol}</strong>
                <span className="block text-xs text-monad-offwhite/60">{token.name}</span>
              </div>
              <span className="text-xs text-monad-offwhite/60">{token.address.slice(0, 6)}…{token.address.slice(-4)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
