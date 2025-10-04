import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 pt-10 text-sm text-white/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-white/70">
          CarbonBlitz · Monad-native liquidity collective ©
          {' '}
          {new Date().getFullYear()}
        </p>
        <div className="flex flex-wrap gap-3">
          <a className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-white/70 transition hover:text-white" href="#">
            Docs
          </a>
          <a className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-white/70 transition hover:text-white" href="#">
            Audit
          </a>
          <a className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-white/70 transition hover:text-white" href="#">
            Status
          </a>
        </div>
      </div>
    </footer>
  );
}
