import React from 'react';

export default function Footer() {
  return (
    <footer className="rounded-3xl border border-white/10 bg-black/30 px-6 py-5 text-sm text-monad-offwhite/70 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Built for Monad • CarbonBlitz ©
          {' '}
          {new Date().getFullYear()}
        </p>
        <div className="flex gap-4">
          <a className="transition hover:text-monad-offwhite" href="#">Docs</a>
          <a className="transition hover:text-monad-offwhite" href="#">Audit</a>
          <a className="transition hover:text-monad-offwhite" href="#">Status</a>
        </div>
      </div>
    </footer>
  );
}
