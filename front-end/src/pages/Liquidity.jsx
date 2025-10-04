import React, { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import XPWindow from '../components/XPWindow.jsx';
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
    pairContract,
    showDialog
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

  const usdcHoldings = useMemo(() => formattedBalance(usdcToken, usdcBalance), [usdcToken, usdcBalance]);
  const cbltzHoldings = useMemo(() => formattedBalance(cbltzToken, cbltzBalance), [cbltzToken, cbltzBalance]);
  const poolRatioText = useMemo(() => {
    if (!poolRatio || !Number.isFinite(poolRatio)) return '--';
    const ratio = Math.max(poolRatio, 0);
    return `1 ${usdcToken?.symbol ?? 'USDC'} ≈ ${ratio.toFixed(4)} ${cbltzToken?.symbol ?? 'CBLTZ'}`;
  }, [poolRatio, usdcToken, cbltzToken]);

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
      showDialog({ title: 'Wallet required', message: 'Connect your wallet to continue.' });
      return;
    }
    if (!amountUsdc || !amountCbltz) {
      showDialog({ title: 'Enter amounts', message: 'Provide both USDC and CBLTZ amounts before depositing.' });
      return;
    }
    if (!usdcToken || !cbltzToken || !pairContract?.address) {
      showDialog({ title: 'Configuration issue', message: 'Token or pair metadata is missing.' });
      return;
    }
    if (insufficientUsdc || insufficientCbltz) {
      showDialog({ title: 'Insufficient balance', message: 'Your wallet balance is insufficient for this deposit.' });
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
    <XPWindow
      title="Liquidity Manager"
      icon="/logo/monad_rwa_logo.png"
      bodyClassName="p-0"
      footer={`Status: ${status.message}`}
    >
      <div className="grid gap-4 p-6 lg:grid-cols-[minmax(0,420px)_minmax(0,260px)]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded border border-xpGray bg-white/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
        >
          <header className="flex flex-col gap-1 text-[#0c3a94]">
            <h2 className="text-[15px] font-semibold">Provide liquidity</h2>
            <span className="text-[11px] text-[#1b1b1b]">{poolRatioText}</span>
          </header>

          <div className="space-y-3">
            <div className="rounded border border-[#94a3c4] bg-[#f3f7ff] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]">
                <span>{usdcToken?.symbol ?? 'USDC'} amount</span>
                <span className="text-[#4b4b4b]">Balance: {usdcHoldings}</span>
              </div>
              <input
                id="usdc-amount"
                value={amountUsdc}
                onChange={(event) => handleUsdcChange(event.target.value)}
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                className="mt-2 w-full rounded border border-[#7b7b7b] bg-white px-3 py-2 text-right text-sm text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#245edb] focus:outline-none"
              />
              {insufficientUsdc && (
                <p className="mt-2 rounded border border-[#d69ca1] bg-[#fef2f2] px-3 py-2 text-[11px] text-[#b91c1c]">
                  Insufficient {usdcToken?.symbol ?? 'USDC'} balance.
                </p>
              )}
            </div>

            <div className="rounded border border-[#94a3c4] bg-white px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]">
                <span>{cbltzToken?.symbol ?? 'CBLTZ'} amount</span>
                <span className="text-[#4b4b4b]">Balance: {cbltzHoldings}</span>
              </div>
              <input
                id="cbltz-amount"
                value={amountCbltz}
                onChange={(event) => handleCbltzChange(event.target.value)}
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                className="mt-2 w-full rounded border border-[#7b7b7b] bg-white px-3 py-2 text-right text-sm text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#245edb] focus:outline-none"
              />
              {insufficientCbltz && (
                <p className="mt-2 rounded border border-[#d69ca1] bg-[#fef2f2] px-3 py-2 text-[11px] text-[#b91c1c]">
                  Insufficient {cbltzToken?.symbol ?? 'CBLTZ'} balance.
                </p>
              )}
            </div>

            <div className="rounded border border-[#d0d7ea] bg-[#f3f7ff] px-3 py-3 text-[12px] text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <p className="font-semibold text-[#0c3a94]">Auto-balance helper</p>
              <p className="mt-1 text-[#4b4b4b]">
                Update either side and the other field syncs to match on-chain reserves.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded border border-[#0b3b9e] bg-gradient-to-b from-[#5099ff] to-[#1c62d1] px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing…' : 'Seed liquidity'}
          </button>
        </form>

        <aside className="space-y-4">
          <div className="rounded border border-xpGray bg-white/90 p-4 text-[12px] text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <h3 className="text-[14px] font-semibold text-[#0c3a94]">Wallet balances</h3>
            <dl className="mt-2 space-y-2">
              <div className="flex items-center justify-between rounded border border-[#d0d7ea] bg-[#f3f7ff] px-3 py-2">
                <dt className="font-semibold text-[#0c3a94]">{usdcToken?.symbol ?? 'USDC'}</dt>
                <dd>{usdcHoldings}</dd>
              </div>
              <div className="flex items-center justify-between rounded border border-[#d0d7ea] bg-[#f9fbff] px-3 py-2">
                <dt className="font-semibold text-[#0c3a94]">{cbltzToken?.symbol ?? 'CBLTZ'}</dt>
                <dd>{cbltzHoldings}</dd>
              </div>
            </dl>
          </div>

          
        </aside>
      </div>
    </XPWindow>
  );
}
