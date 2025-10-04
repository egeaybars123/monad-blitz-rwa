import React, { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import { useApp } from '../state/AppProvider.jsx';

export default function Swap() {
  const {
    tokens,
    selectedTokens,
    updateSelectedTokens,
    openTokenDrawer,
    wallet,
    status,
    callContract,
    parseUnits,
    pairInfo,
    refreshMetrics,
    balances,
    refreshBalances,
    writeTokenContract,
    publicClient,
    pairContract
  } = useApp();
  const [payAmount, setPayAmount] = useState('');
  const [receivePreview, setReceivePreview] = useState('--');
  const [expectedOut, setExpectedOut] = useState(0n);
  const [isSwapping, setIsSwapping] = useState(false);

  const payTokenBalance = useMemo(() => {
    if (!selectedTokens.pay) return null;
    return balances[selectedTokens.pay.address.toLowerCase()] ?? null;
  }, [balances, selectedTokens.pay]);

  const formattedBalance = useMemo(() => {
    if (!selectedTokens.pay || !payTokenBalance) return '--';
    const { formatted = '0' } = payTokenBalance;
    const [integerPart, decimalPart = ''] = formatted.split('.');
    if (!decimalPart) return integerPart;
    return `${integerPart}.${decimalPart.slice(0, Math.min(6, decimalPart.length))}`;
  }, [payTokenBalance, selectedTokens.pay]);

  const parsedPayAmount = useMemo(() => {
    if (!selectedTokens.pay || !payAmount) return 0n;
    try {
      return parseUnits(payAmount, selectedTokens.pay.decimals ?? 18);
    } catch (error) {
      console.warn('Amount parse failed', error);
      return 0n;
    }
  }, [payAmount, parseUnits, selectedTokens.pay]);

  const insufficientBalance = useMemo(() => {
    if (!payTokenBalance) return false;
    return parsedPayAmount > (payTokenBalance.raw ?? 0n);
  }, [parsedPayAmount, payTokenBalance]);

  const handleSwitch = () => {
    updateSelectedTokens(({ pay, receive }) => ({ pay: receive, receive: pay }));
  };

  const handleTokenPick = (slot) => {
    const otherSlot = slot === 'pay' ? 'receive' : 'pay';
    const exclude = selectedTokens[otherSlot]?.address ? [selectedTokens[otherSlot].address] : [];

    openTokenDrawer(
      `Select ${slot === 'pay' ? 'pay' : 'receive'} token`,
      (token) => {
        updateSelectedTokens((current) => ({
          ...current,
          [slot]: token
        }));
      },
      { exclude }
    );
  };

  const handleSwap = async () => {
    if (!wallet.address) {
      alert('Connect wallet to continue.');
      return;
    }
    if (!selectedTokens.pay || !selectedTokens.receive) {
      alert('Select both tokens first.');
      return;
    }
    if (!payAmount || Number(payAmount) <= 0) {
      alert('Enter an amount to pay.');
      return;
    }
    if (!pairInfo || !pairContract?.address) {
      alert('Pair information unavailable.');
      return;
    }
    if (expectedOut <= 0n) {
      alert('Unable to derive output amount. Check reserves or input.');
      return;
    }
    if (insufficientBalance) {
      alert('Insufficient balance for this swap.');
      return;
    }

    const payAddress = selectedTokens.pay.address.toLowerCase();
    const receiveAddress = selectedTokens.receive.address.toLowerCase();
    const token0 = pairInfo.token0.toLowerCase();
    const token1 = pairInfo.token1.toLowerCase();

    let amount0Out = 0n;
    let amount1Out = 0n;

    if (payAddress === token0 && receiveAddress === token1) {
      amount1Out = expectedOut;
    } else if (payAddress === token1 && receiveAddress === token0) {
      amount0Out = expectedOut;
    } else {
      alert('Selected tokens do not align with the configured pair.');
      return;
    }

    try {
      setIsSwapping(true);
      const amountIn = parsedPayAmount;
      const transferHash = await writeTokenContract(selectedTokens.pay, 'transfer', [
        pairContract.address,
        amountIn
      ]);

      if (!transferHash) {
        setIsSwapping(false);
        return;
      }

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: transferHash });
      }

      const swapHash = await callContract('uniswapV2Pair', 'swap', [
        amount0Out,
        amount1Out,
        wallet.address,
        '0x'
      ]);

      if (swapHash && publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: swapHash });
      }

      setPayAmount('');
      setReceivePreview('--');
      setExpectedOut(0n);
      await refreshMetrics();
      await refreshBalances();
    } finally {
      setIsSwapping(false);
    }
  };

  useEffect(() => {
    if (!pairInfo || !selectedTokens.pay || !selectedTokens.receive) {
      setReceivePreview('--');
      setExpectedOut(0n);
      return;
    }

    const payAddress = selectedTokens.pay.address.toLowerCase();
    const receiveAddress = selectedTokens.receive.address.toLowerCase();
    const token0 = pairInfo.token0.toLowerCase();
    const token1 = pairInfo.token1.toLowerCase();

    const mapReserves = () => {
      if (payAddress === token0 && receiveAddress === token1) {
        return { reserveIn: pairInfo.reserve0, reserveOut: pairInfo.reserve1 };
      }
      if (payAddress === token1 && receiveAddress === token0) {
        return { reserveIn: pairInfo.reserve1, reserveOut: pairInfo.reserve0 };
      }
      return null;
    };

    const reserves = mapReserves();
    if (!reserves) {
      setReceivePreview('--');
      setExpectedOut(0n);
      return;
    }

    if (!payAmount || Number(payAmount) <= 0) {
      setReceivePreview('--');
      setExpectedOut(0n);
      return;
    }

    try {
      const amountIn = parseUnits(payAmount, selectedTokens.pay.decimals ?? 18);
      if (amountIn <= 0n) {
        setReceivePreview('--');
        setExpectedOut(0n);
        return;
      }

      const amountInWithFee = amountIn * 997n / 1000n;
      const numerator = amountInWithFee * reserves.reserveOut;
      const denominator = reserves.reserveIn + amountInWithFee;
      if (denominator === 0n) {
        setReceivePreview('--');
        setExpectedOut(0n);
        return;
      }

      const amountOut = numerator / denominator;
      setExpectedOut(amountOut);

      const previewFloat = Number.parseFloat(
        formatUnits(amountOut, selectedTokens.receive.decimals ?? 18)
      );
      if (Number.isNaN(previewFloat)) {
        setReceivePreview('--');
        return;
      }

      setReceivePreview(previewFloat.toLocaleString('en-US', { maximumFractionDigits: 6 }));
    } catch (error) {
      console.error('Preview calculation failed', error);
      setReceivePreview('--');
      setExpectedOut(0n);
    }
  }, [payAmount, parseUnits, pairInfo, selectedTokens]);

  return (
    <section className="rounded-3xl border border-monad-purple/25 bg-monad-black/70 p-8 shadow-xl backdrop-blur">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-semibold">Swap</h3>
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

      <div className="mt-8 space-y-6 rounded-3xl border border-monad-purple/25 bg-[linear-gradient(160deg,rgba(14,16,15,0.92),rgba(32,0,82,0.55))] p-6 shadow-lg">
        <div className="space-y-2">
          <label className="text-sm font-medium text-monad-offwhite/80">Pay</label>
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
            <input
              value={payAmount}
              onChange={(event) => setPayAmount(event.target.value)}
              type="number"
              min="0"
              placeholder="0.0"
              className="w-full bg-transparent text-2xl font-semibold text-monad-offwhite placeholder:text-monad-offwhite/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleTokenPick('pay')}
              className="rounded-xl border border-monad-purple/30 bg-monad-blue/70 px-4 py-2 text-sm font-semibold transition hover:border-monad-berry/40 hover:bg-monad-berry/30"
            >
              {selectedTokens.pay?.symbol ?? 'Select'}
            </button>
          </div>
          <span className="text-xs text-monad-offwhite/50">
            Balance:
            {' '}
            {formattedBalance}
          </span>
          {insufficientBalance && (
            <span className="block text-xs text-amber-300/80">Insufficient balance.</span>
          )}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwitch}
            className="rounded-full border border-white/10 bg-white/10 p-3 text-lg transition hover:border-monad-berry/40 hover:bg-monad-berry/25"
            aria-label="Switch pair"
          >
            ⇅
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-monad-offwhite/80">Receive</label>
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
            <input
              type="text"
              readOnly
              placeholder="0.0"
              value={receivePreview === '--' ? '' : receivePreview}
              className="w-full bg-transparent text-2xl font-semibold text-monad-offwhite placeholder:text-monad-offwhite/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleTokenPick('receive')}
              className="rounded-xl border border-monad-purple/30 bg-monad-blue/70 px-4 py-2 text-sm font-semibold transition hover:border-monad-berry/40 hover:bg-monad-berry/30"
            >
              {selectedTokens.receive?.symbol ?? 'Select'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSwap}
          className="w-full rounded-full bg-gradient-to-r from-monad-berry to-monad-purple px-4 py-3 text-center text-sm font-semibold shadow-glow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!wallet.address || isSwapping || insufficientBalance || parsedPayAmount === 0n}
        >
          {wallet.address ? (isSwapping ? 'Swapping…' : 'Swap') : 'Connect wallet'}
        </button>
      </div>

      {tokens.length === 0 && (
        <p className="mt-6 text-sm text-amber-300/80">
          Token list is empty. Populate `config/contracts.json` to enable swapping.
        </p>
      )}
    </section>
  );
}
