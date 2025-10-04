import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
  http,
  parseUnits
} from 'viem';

const AppContext = createContext(null);

const initialStatus = {
  message: 'Wallet disconnected',
  connected: false
};

export function AppProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [chain, setChain] = useState(null);
  const [publicClient, setPublicClient] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const [wallet, setWallet] = useState({ address: null, chainId: null, isAdmin: false });
  const [status, setStatus] = useState(initialStatus);
  const [tokens, setTokens] = useState([]);
  const [selectedTokens, setSelectedTokens] = useState({ pay: null, receive: null });
  const [metrics, setMetrics] = useState({
    tvl: '$--',
    volume: '$--',
    supply: '-- CBLTZ',
    reserves: {
      usd: '--',
      try: '--'
    },
    lastSync: 'Awaiting on-chain data',
    deviceCount: '--',
    pendingMints: '--',
    energyProcessed: '--',
    lastDeviceSync: 'Telemetry feed idle',
    poolPrice: '--'
  });
  const [drawerState, setDrawerState] = useState({ open: false, callback: null, title: 'Select token' });

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/config/contracts.json');
        if (!response.ok) throw new Error('Config not reachable');
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error('Config load failed', error);
        setStatus({ message: 'Initialization failed', connected: false });
      }
    }

    loadConfig();
  }, []);

  useEffect(() => {
    if (!config) return;

    const nextTokens = Object.values(config.tokens || {});
    setTokens(nextTokens);
    if (nextTokens.length >= 2) {
      setSelectedTokens({ pay: nextTokens[0], receive: nextTokens[1] });
    }

    const nextChain = {
      id: config.network.chainId,
      name: config.network.name,
      rpcUrls: {
        default: { http: [config.network.rpcUrl] },
        public: { http: [config.network.rpcUrl] }
      },
      nativeCurrency: {
        name: 'Monad',
        symbol: 'MON',
        decimals: 18
      }
    };

    try {
      const client = createPublicClient({ chain: nextChain, transport: http(config.network.rpcUrl) });
      setChain(nextChain);
      setPublicClient(client);
    } catch (error) {
      console.error('Public client init failed', error);
    }
  }, [config]);

  const evaluateAdminStatus = useCallback(
    (address) => {
      if (!config?.admin?.whitelist?.length || !address) {
        return false;
      }
      return config.admin.whitelist.some((entry) => entry.toLowerCase() === address.toLowerCase());
    },
    [config]
  );

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask or a compatible wallet is required.');
      return;
    }

    try {
      const [address] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = Number(chainIdHex);

      if (chain && chainId !== chain.id) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${chain.id.toString(16)}`,
              chainName: chain.name,
              rpcUrls: [config.network.rpcUrl],
              nativeCurrency: chain.nativeCurrency
            }
          ]
        });
      }

      let nextWalletClient = walletClient;
      if (!walletClient) {
        nextWalletClient = createWalletClient({ chain, transport: custom(window.ethereum) });
        setWalletClient(nextWalletClient);
      }

      const isAdmin = evaluateAdminStatus(address);
      setWallet({ address, chainId, isAdmin });
      setStatus({ message: 'Wallet connected', connected: true });
    } catch (error) {
      console.error('Wallet connection failed', error);
      setStatus({ message: 'Wallet connection failed', connected: false });
    }
  }, [chain, config, evaluateAdminStatus, walletClient]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccounts = (accounts) => {
      if (!accounts.length) {
        setWallet({ address: null, chainId: null, isAdmin: false });
        setStatus(initialStatus);
        return;
      }
      const [address] = accounts;
      setWallet((prev) => ({ ...prev, address, isAdmin: evaluateAdminStatus(address) }));
      setStatus({ message: 'Wallet connected', connected: true });
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on('accountsChanged', handleAccounts);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccounts);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [evaluateAdminStatus]);

  const openTokenDrawer = useCallback((title, callback) => {
    setDrawerState({ open: true, callback, title });
  }, []);

  const closeTokenDrawer = useCallback(() => {
    setDrawerState({ open: false, callback: null, title: 'Select token' });
  }, []);

  const selectToken = useCallback(
    (token) => {
      if (drawerState.callback) {
        drawerState.callback(token);
      }
      closeTokenDrawer();
    },
    [drawerState.callback, closeTokenDrawer]
  );

  const updateSelectedTokens = useCallback((updater) => {
    setSelectedTokens((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      return next;
    });
  }, []);

  const callContract = useCallback(
    async (contractKey, method, params = []) => {
      if (!walletClient || !config?.contracts?.[contractKey]) {
        alert('Wallet client unavailable or contract not configured.');
        return;
      }

      const contractConf = config.contracts[contractKey];
      if (!contractConf.abi) {
        alert(`ABI path missing for ${contractKey}`);
        return;
      }

      try {
        const abiResponse = await fetch(contractConf.abi);
        if (!abiResponse.ok) throw new Error('ABI fetch failed');
        const abiJson = await abiResponse.json();
        if (!abiJson?.abi?.length) throw new Error('ABI array missing');

        const contract = getContract({
          address: contractConf.address,
          abi: abiJson.abi,
          client: walletClient
        });

        if (typeof contract.write?.[method] !== 'function') {
          throw new Error(`Method ${method} not found in ABI`);
        }

        const args = Array.isArray(params) ? params : [params];
        const hash = await contract.write[method](args);
        console.info(`${method} submitted`, hash);
        alert(`${method} transaction sent. Hash: ${hash}`);
      } catch (error) {
        console.error(`${method} failed`, error);
        alert(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
    },
    [config, walletClient]
  );

  const refreshMetrics = useCallback(async () => {
    setMetrics((curr) => ({ ...curr }));
    if (!publicClient || !config?.contracts?.uniswapV2Factory?.abi) {
      return;
    }

    try {
      const factoryRes = await fetch(config.contracts.uniswapV2Factory.abi);
      const routerRes = await fetch(config.contracts.uniswapV2Router.abi);
      const [factoryAbi, routerAbi] = await Promise.all([factoryRes.json(), routerRes.json()]);
      if (!factoryAbi?.abi?.length || !routerAbi?.abi?.length) {
        return;
      }
      // TODO: user should extend metric reads after ABIs are populated.
    } catch (error) {
      console.warn('Metric fetch skipped until ABI data is provided', error);
    }
  }, [config, publicClient]);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  const value = useMemo(
    () => ({
      config,
      chain,
      publicClient,
      walletClient,
      wallet,
      status,
      connectWallet,
      tokens,
      selectedTokens,
      updateSelectedTokens,
      metrics,
      openTokenDrawer,
      closeTokenDrawer,
      drawerState,
      selectToken,
      callContract,
      parseUnits
    }),
    [
      config,
      chain,
      publicClient,
      walletClient,
      wallet,
      status,
      connectWallet,
      tokens,
      selectedTokens,
      updateSelectedTokens,
      metrics,
      openTokenDrawer,
      closeTokenDrawer,
      drawerState,
      selectToken,
      callContract
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
