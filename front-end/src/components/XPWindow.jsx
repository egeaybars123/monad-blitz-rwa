import React from 'react';

function mergeClassNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function XPWindow({
  title,
  icon,
  children,
  className,
  footer,
  bodyClassName
}) {
  return (
    <div
      className={mergeClassNames(
        'flex w-full max-w-4xl flex-col rounded-md border-2 border-xpGray bg-xpCream text-[13px] text-[#1b1b1b] shadow-xpRaised',
        'overflow-hidden font-xp max-h-[calc(100vh-180px)]',
        className
      )}
    >
      <header className="flex items-center justify-between bg-gradient-to-r from-xpBlueDark via-xpBlue to-xpBlueLight px-3 py-1 text-white">
        <div className="flex items-center gap-2">
          {icon && (
            <img
              src={icon}
              alt="window icon"
              className="h-4 w-4 rounded-sm border border-white/40 bg-white/40 object-cover"
            />
          )}
          <span className="text-sm font-semibold tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {['_', '▢', '✕'].map((symbol) => (
            <span
              key={symbol}
              className="flex h-5 w-5 items-center justify-center rounded-sm border border-white/40 bg-white/30 text-xs font-bold text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]"
            >
              {symbol}
            </span>
          ))}
        </div>
      </header>
      <div className={mergeClassNames('flex-1 overflow-y-auto bg-gradient-to-br from-white via-xpCream to-[#e3e3e3] p-6', bodyClassName)}>
        {children}
      </div>
      {footer && <footer className="border-t border-white/70 bg-[#d7e4f4]/80 px-3 py-2 text-[11px] text-[#21409a]">{footer}</footer>}
    </div>
  );
}
