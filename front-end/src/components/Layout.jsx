import React from 'react';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import TokenDrawer from './TokenDrawer.jsx';

export default function Layout({ children }) {
  return (
    <div className="relative min-h-screen bg-monad-black text-monad-offwhite">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(160,5,93,0.18),transparent_48%),radial-gradient(circle_at_80%_85%,rgba(32,0,82,0.22),transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(131,110,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(131,110,249,0.08)_1px,transparent_1px)] bg-[length:78px_78px] opacity-30"
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-5 py-12 lg:px-10">
        <Navbar />
        <main className="flex flex-1 flex-col gap-10">{children}</main>
        <Footer />
      </div>
      <TokenDrawer />
    </div>
  );
}
