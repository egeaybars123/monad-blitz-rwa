import React, { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useApp } from '../state/AppProvider.jsx';

export default function Liquidity() {
  const {
    tokens,
    wallet,
    status,
    callContract,
    refreshMetrics,
    pairInfo,
    balances,
    parseUnits,
    writeTokenContract,
    refreshBalances,
    publicClient,
    pairContract
  } = useApp();
  const [amountUsdc, setAmountUsdc] = useState('');
  const [amountCbltz, setAmountCbltz] = useState('');
  const [lastEdited, setLastEdited] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usdcToken = useMemo(() => tokens.find((token) => token.symbol === 'USDC'), [tokens]);
  const cbltzToken = useMemo(() => tokens.find((token) => token.symbol === 'CBLTZ'), [tokens]);

  const usdcBalance = useMemo(() => {
    if (!usdcToken) return null;
    return balances[usdcToken.address.toLowerCase()] ?? null;
  }, [balances, usdcToken]);

  const cbltzBalance = useMemo(() => {
    if (!cbltzToken) return null;
    return balances[cbltzToken.address.toLowerCase()] ?? null;
  }, [balances, cbltzToken]);

  const formattedBalance = (tokenMeta, balanceEntry) => {
    if (!tokenMeta || !balanceEntry) return '--';
    const { formatted = '0' } = balanceEntry;
    const [integerPart, decimalPart = ''] = formatted.split('.');
    if (!decimalPart) return integerPart;
    return `${integerPart}.${decimalPart.slice(0, Math.min(6, decimalPart.length))}`;
  };

  const parsedUsdc = useMemo(() => {
    if (!usdcToken || !amountUsdc) return 0n;
    try {
      return parseUnits(amountUsdc, usdcToken.decimals ?? 6);
    } catch (error) {
      console.warn('USDC parse failed', error);
      return 0n;
    }
  }, [amountUsdc, parseUnits, usdcToken]);

  const parsedCbltz = useMemo(() => {
    if (!cbltzToken || !amountCbltz) return 0n;
    try {
      return parseUnits(amountCbltz, cbltzToken.decimals ?? 18);
    } catch (error) {
      console.warn('CBLTZ parse failed', error);
      return 0n;
    }
  }, [amountCbltz, parseUnits, cbltzToken]);

  const insufficientUsdc = useMemo(() => {
    if (!usdcBalance) return false;
    return parsedUsdc > (usdcBalance.raw ?? 0n);
  }, [parsedUsdc, usdcBalance]);

  const insufficientCbltz = useMemo(() => {
    if (!cbltzBalance) return false;
    return parsedCbltz > (cbltzBalance.raw ?? 0n);
  }, [parsedCbltz, cbltzBalance]);

  const poolRatio = useMemo(() => {
    if (!pairInfo || !usdcToken || !cbltzToken) return null;

    const isUsdcToken0 = pairInfo.token0.toLowerCase() === (usdcToken.address ?? '').toLowerCase();
    const isCbltzToken0 = pairInfo.token0.toLowerCase() === (cbltzToken.address ?? '').toLowerCase();

    const reserveUsdcRaw = isUsdcToken0 ? pairInfo.reserve0 : pairInfo.reserve1;
    const reserveCbltzRaw = isCbltzToken0 ? pairInfo.reserve0 : pairInfo.reserve1;

    if (!reserveUsdcRaw || !reserveCbltzRaw) return null;

    const reserveUsdcFloat = Number.parseFloat(
      formatUnits(reserveUsdcRaw, usdcToken.decimals ?? 6)
    );
    const reserveCbltzFloat = Number.parseFloat(
      formatUnits(reserveCbltzRaw, cbltzToken.decimals ?? 18)
    );

    if (Number.isNaN(reserveUsdcFloat) || Number.isNaN(reserveCbltzFloat) || reserveUsdcFloat === 0) {
      return null;
    }

    return reserveCbltzFloat / reserveUsdcFloat;
  }, [pairInfo, usdcToken, cbltzToken]);

  useEffect(() => {
    if (!poolRatio) return;

    if (lastEdited === 'usdc' && amountUsdc) {
      const numeric = Number(amountUsdc);
      if (Number.isFinite(numeric)) {
        const derived = numeric * poolRatio;
        if (!Number.isNaN(derived)) {
          const precision = Math.min(6, cbltzToken?.decimals ?? 18);
          setAmountCbltz(derived.toFixed(precision).replace(/\.0+$|0+$/u, '').replace(/\.$/, ''));
        }
      }
    }

    if (lastEdited === 'cbltz' && amountCbltz) {
      if (poolRatio === 0) return;
      const numeric = Number(amountCbltz);
      if (Number.isFinite(numeric)) {
        const derived = numeric / poolRatio;
        if (!Number.isNaN(derived)) {
          const precision = Math.min(6, usdcToken?.decimals ?? 6);
          setAmountUsdc(derived.toFixed(precision).replace(/\.0+$|0+$/u, '').replace(/\.$/, ''));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolRatio]);

  const handleUsdcChange = (value) => {
    setLastEdited('usdc');
    setAmountUsdc(value);
    if (!value) {
      setAmountCbltz('');
      return;
    }
    if (!poolRatio) return;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    const derived = numeric * poolRatio;
    if (Number.isNaN(derived)) return;
    const precision = Math.min(6, cbltzToken?.decimals ?? 18);
    setAmountCbltz(derived.toFixed(precision).replace(/\.0+$|0+$/u, '').replace(/\.$/, ''));
  };

  const handleCbltzChange = (value) => {
    setLastEdited('cbltz');
    setAmountCbltz(value);
    if (!value) {
      setAmountUsdc('');
      return;
    }
    if (!poolRatio) return;
    if (poolRatio === 0) return;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    const derived = numeric / poolRatio;
    if (Number.isNaN(derived)) return;
    const precision = Math.min(6, usdcToken?.decimals ?? 6);
    setAmountUsdc(derived.toFixed(precision).replace(/\.0+$|0+$/u, '').replace(/\.$/, ''));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!wallet.address) {
      alert('Connect wallet to continue.');
      return;
    }
    if (!amountUsdc || !amountCbltz) {
      alert('Enter token amounts.');
      return;
    }
    if (!usdcToken || !cbltzToken || !pairContract?.address) {
      alert('Token or pair metadata missing.');
      return;
    }
    if (insufficientUsdc || insufficientCbltz) {
      alert('Insufficient balance for deposit.');
      return;
    }

    try {
      setIsSubmitting(true);
      const transferUsdcHash = await writeTokenContract(usdcToken, 'transfer', [
        pairContract.address,
        parsedUsdc
      ]);
      if (!transferUsdcHash) {
        setIsSubmitting(false);
        return;
      }
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: transferUsdcHash });
      }

      const transferCbltzHash = await writeTokenContract(cbltzToken, 'transfer', [
        pairContract.address,
        parsedCbltz
      ]);
      if (!transferCbltzHash) {
        setIsSubmitting(false);
        return;
      }
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: transferCbltzHash });
      }

      const mintHash = await callContract('uniswapV2Pair', 'mint', [wallet.address]);
      if (mintHash && publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: mintHash });
      }

      setAmountUsdc('');
      setAmountCbltz('');
      await refreshMetrics();
      await refreshBalances();
    } catch (error) {
      console.error('Mint liquidity failed', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-monad-purple/25 bg-monad-black/70 p-8 shadow-xl backdrop-blur">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-semibold">Provide Liquidity</h3>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
            status.connected
              ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
              : 'border-rose-400/40 bg-rose-500/15 text-rose-200'
          }`}
        >
          {status.message}
        </span>
      </header>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-monad-offwhite/80" htmlFor="amount-usdc">
            USDC amount
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-monad-purple/25 bg-black/30 px-4 py-3">
            <input
              id="amount-usdc"
              value={amountUsdc}
              onChange={(event) => handleUsdcChange(event.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.0"
              className="w-full bg-transparent text-lg font-semibold text-monad-offwhite placeholder:text-monad-offwhite/40 focus:outline-none"
            />
            <span className="rounded-full border border-monad-purple/25 bg-monad-blue/60 px-3 py-1 text-xs font-semibold text-monad-offwhite/80">
              USDC
            </span>
          </div>
          <span className="text-xs text-monad-offwhite/50">
            Balance:
            {' '}
            {formattedBalance(usdcToken, usdcBalance)}
          </span>
          {insufficientUsdc && (
            <span className="block text-xs text-amber-300/80">Insufficient USDC balance.</span>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-monad-offwhite/80" htmlFor="amount-cbltz">
            CorbanBlitz amount
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-monad-purple/25 bg-black/30 px-4 py-3">
            <input
              id="amount-cbltz"
              value={amountCbltz}
              onChange={(event) => handleCbltzChange(event.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.0"
              className="w-full bg-transparent text-lg font-semibold text-monad-offwhite placeholder:text-monad-offwhite/40 focus:outline-none"
            />
            <span className="rounded-full border border-monad-purple/25 bg-monad-berry/40 px-3 py-1 text-xs font-semibold text-monad-offwhite/80">
              CBLTZ
            </span>
          </div>
          <span className="text-xs text-monad-offwhite/50">
            Balance:
            {' '}
            {formattedBalance(cbltzToken, cbltzBalance)}
          </span>
          {insufficientCbltz && (
            <span className="block text-xs text-amber-300/80">Insufficient CBLTZ balance.</span>
          )}
        </div>

        <div className="sm:col-span-2 space-y-4 rounded-3xl border border-dashed border-monad-purple/30 bg-black/30 px-6 py-5">
          <p className="text-sm text-monad-offwhite/70">
            Ensure you transfer the quoted token amounts directly to the pair contract before submitting. The mint call
            will finalise your position and issue LP tokens to your connected wallet.
          </p>
          {poolRatio && (
            <p className="text-xs text-monad-offwhite/60">
              Current pool ratio suggests ~{poolRatio.toFixed(2)} CBLTZ per USDC for balanced deposits.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-monad-berry to-monad-purple px-4 py-3 text-center text-sm font-semibold shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              !wallet.address
              || isSubmitting
              || insufficientUsdc
              || insufficientCbltz
              || parsedUsdc === 0n
              || parsedCbltz === 0n
            }
          >
            {wallet.address ? (isSubmitting ? 'Minting…' : 'Mint LP tokens') : 'Connect wallet'}
          </button>
        </div>
      </form>

      {tokens.length === 0 && (
        <p className="mt-6 text-sm text-amber-300/80">
          Token list is empty. Populate `config/contracts.json` to enable liquidity provisioning.
        </p>
      )}
    </section>
  );
}
