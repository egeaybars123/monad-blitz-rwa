import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  formatUnits
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
  const [pairContract, setPairContract] = useState(null);
  const [pairInfo, setPairInfo] = useState(null);
  const [balances, setBalances] = useState({});
  const [metrics, setMetrics] = useState({
    tvl: '$--',
    volume: '$--',
    supply: '-- CBLTZ',
    reserves: {
      usdc: '--',
      cbltz: '--'
    },
    lastSync: 'Awaiting on-chain data',
    deviceCount: '--',
    pendingMints: '--',
    energyProcessed: '--',
    lastDeviceSync: 'Telemetry feed idle'
  });
  const [drawerState, setDrawerState] = useState({ open: false, callback: null, title: 'Select token' });
  const abiCache = useRef(new Map());

  const fetchAbi = useCallback(async (path) => {
    if (!path) throw new Error('ABI path missing');
    const cached = abiCache.current.get(path);
    if (cached) return cached;

    const response = await fetch(path);
    if (!response.ok) throw new Error(`ABI not reachable at ${path}`);
    const data = await response.json();
    if (!data?.abi?.length) throw new Error('ABI array missing');
    abiCache.current.set(path, data.abi);
    return data.abi;
  }, []);

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

    if (config.contracts?.uniswapV2Pair?.abi) {
      (async () => {
        try {
          const pairAbi = await fetchAbi(config.contracts.uniswapV2Pair.abi);
          setPairContract({
            address: config.contracts.uniswapV2Pair.address,
            abi: pairAbi
          });
        } catch (error) {
          console.error('Pair ABI load failed', error);
          setPairContract(null);
        }
      })();
    } else {
      setPairContract(null);
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
      if (!wallet.address) {
        alert('Connect wallet to continue.');
        return;
      }
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
        const args = Array.isArray(params) ? params : [params];
        const abi = await fetchAbi(contractConf.abi);
        const hash = await walletClient.writeContract({
          address: contractConf.address,
          abi,
          functionName: method,
          args,
          account: wallet.address
        });

        console.info(`${method} submitted`, hash);
        alert(`${method} transaction sent. Hash: ${hash}`);
        return hash;
      } catch (error) {
        console.error(`${method} failed`, error);
        alert(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
    },
    [config, walletClient, wallet.address, fetchAbi]
  );

  const writeTokenContract = useCallback(
    async (tokenMeta, method, params = []) => {
      if (!tokenMeta?.address) {
        alert('Token metadata incomplete.');
        return;
      }
      if (!wallet.address) {
        alert('Connect wallet to continue.');
        return;
      }
      if (!walletClient) {
        alert('Wallet client unavailable.');
        return;
      }

      try {
        const abi = await fetchAbi(tokenMeta.abi || '/abis/erc20.json');
        const args = Array.isArray(params) ? params : [params];
        const hash = await walletClient.writeContract({
          address: tokenMeta.address,
          abi,
          functionName: method,
          args,
          account: wallet.address
        });
        console.info(`${method} submitted for ${tokenMeta.symbol}`, hash);
        alert(`${method} transaction sent. Hash: ${hash}`);
        return hash;
      } catch (error) {
        console.error(`${method} failed for ${tokenMeta?.symbol}`, error);
        alert(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
    },
    [fetchAbi, wallet.address, walletClient]
  );

  const refreshBalances = useCallback(async () => {
    if (!wallet.address || !publicClient || !tokens.length) {
      setBalances({});
      return;
    }

    try {
      const balanceEntries = await Promise.all(
        tokens.map(async (token) => {
          try {
            const abi = await fetchAbi(token.abi || '/abis/erc20.json');
            const raw = await publicClient.readContract({
              address: token.address,
              abi,
              functionName: 'balanceOf',
              args: [wallet.address]
            });
            const formatted = formatUnits(raw, token.decimals ?? 18);
            return [
              token.address.toLowerCase(),
              { raw, formatted }
            ];
          } catch (error) {
            console.warn(`Balance fetch failed for ${token.symbol}`, error);
            return [token.address.toLowerCase(), { raw: 0n, formatted: '0' }];
          }
        })
      );

      setBalances(Object.fromEntries(balanceEntries));
    } catch (error) {
      console.error('Balance refresh failed', error);
    }
  }, [fetchAbi, publicClient, tokens, wallet.address]);

  const refreshMetrics = useCallback(async () => {
    if (!publicClient || !pairContract?.abi) {
      return;
    }

    try {
      const [token0, token1, reserves] = await Promise.all([
        publicClient.readContract({
          address: pairContract.address,
          abi: pairContract.abi,
          functionName: 'token0'
        }),
        publicClient.readContract({
          address: pairContract.address,
          abi: pairContract.abi,
          functionName: 'token1'
        }),
        publicClient.readContract({
          address: pairContract.address,
          abi: pairContract.abi,
          functionName: 'getReserves'
        })
      ]);

      const [reserve0Raw, reserve1Raw] = Array.isArray(reserves)
        ? reserves
        : [reserves._reserve0, reserves._reserve1];

      const findTokenMeta = (address) =>
        tokens.find((token) => token.address.toLowerCase() === address.toLowerCase());

      const token0Meta = findTokenMeta(token0);
      const token1Meta = findTokenMeta(token1);

      const formatReserve = (value, decimals) => {
        if (typeof value === 'undefined' || value === null) {
          return '--';
        }
        try {
          const parsed = Number.parseFloat(formatUnits(value, decimals));
          if (!Number.isFinite(parsed)) return '--';
          return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(parsed);
        } catch (error) {
          console.warn('Reserve format failed', error);
          return '--';
        }
      };

      const nextReserves = {
        usdc: token0Meta?.symbol === 'USDC'
          ? formatReserve(reserve0Raw, token0Meta.decimals)
          : formatReserve(reserve1Raw, token1Meta?.decimals ?? 18),
        cbltz: token0Meta?.symbol === 'CBLTZ'
          ? formatReserve(reserve0Raw, token0Meta.decimals)
          : formatReserve(reserve1Raw, token1Meta?.decimals ?? 18)
      };

      setPairInfo({
        token0,
        token1,
        reserve0: reserve0Raw,
        reserve1: reserve1Raw,
        blockTimestampLast: Array.isArray(reserves) ? reserves[2] : reserves._blockTimestampLast
      });

      setMetrics((current) => ({
        ...current,
        reserves: nextReserves,
        lastSync: `Reserves synced ${new Date().toLocaleTimeString()}`
      }));
    } catch (error) {
      console.error('Metric refresh failed', error);
    }
  }, [pairContract, publicClient, tokens]);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  useEffect(() => {
    refreshBalances();
  }, [refreshBalances]);

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
      parseUnits,
      pairContract,
      pairInfo,
      refreshMetrics,
      balances,
      refreshBalances,
      writeTokenContract
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
      callContract,
      pairContract,
      pairInfo,
      refreshMetrics,
      balances,
      refreshBalances,
      writeTokenContract
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
