import React from 'react';

export default function XPDialog({ title, message, detail, linkHref, linkLabel, onClose }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0b0b0b]/45 px-4 backdrop-blur-[1.5px]">
      <div className="w-full max-w-sm overflow-hidden rounded-md border-2 border-xpGray bg-xpCream text-[13px] text-[#1b1b1b] shadow-xpRaised font-xp">
        <header className="flex items-center justify-between bg-gradient-to-r from-xpBlueDark via-xpBlue to-xpBlueLight px-3 py-1 text-white">
          <span className="text-sm font-semibold tracking-tight">{title || 'CarbonBlitz'}</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center rounded-sm border border-white/40 bg-white/30 text-xs font-bold shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)] transition hover:bg-white/40"
          >
            ✕
          </button>
        </header>
        <div className="space-y-3 bg-gradient-to-br from-white via-xpCream to-[#e3e3e3] px-4 py-4">
          {message && <p className="text-[13px] leading-relaxed">{message}</p>}
          {detail && (
            <div className="rounded border border-[#9aa6c5] bg-white px-3 py-2 font-mono text-[11px] text-[#0c3a94] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              {detail}
            </div>
          )}
          {linkHref && (
            <a
              href={linkHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded border border-[#0b3b9e] bg-gradient-to-b from-[#5099ff] to-[#1c62d1] px-3 py-1.5 text-[12px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:brightness-110"
            >
              {linkLabel || 'Open in explorer'}
            </a>
          )}
        </div>
        <footer className="flex justify-end bg-[#d7e4f4]/90 px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#7b8dbd] bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#0c3a94] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:border-[#1c62d1]"
          >
            OK
          </button>
        </footer>
      </div>
    </div>
  );
}
