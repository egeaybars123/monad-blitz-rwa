import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Swap from './pages/Swap.jsx';
import Liquidity from './pages/Liquidity.jsx';
import Analytics from './pages/Analytics.jsx';
import Admin from './pages/Admin.jsx';
import { AppProvider } from './state/AppProvider.jsx';

export default function App() {
  return (
    <AppProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/swap" element={<Swap />} />
          <Route path="/liquidity" element={<Liquidity />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </AppProvider>
  );
}
