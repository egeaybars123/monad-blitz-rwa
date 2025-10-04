import React, { useEffect, useMemo, useState } from 'react';
import { formatUnits } from 'viem';
import XPWindow from '../components/XPWindow.jsx';
import { useApp } from '../state/AppProvider.jsx';

export default function Swap() {
  const {
    tokens,
    selectedTokens,
    updateSelectedTokens,
    openTokenDrawer,
    wallet,
    callContract,
    parseUnits,
    pairInfo,
    refreshMetrics,
    balances,
    refreshBalances,
    writeTokenContract,
    publicClient,
    pairContract,
    showDialog
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

  const pairTokens = useMemo(() => {
    if (!pairInfo) return null;
    const tokenMap = new Map(tokens.map((token) => [token.address.toLowerCase(), token]));
    const token0 = tokenMap.get(pairInfo.token0?.toLowerCase?.() ?? '');
    const token1 = tokenMap.get(pairInfo.token1?.toLowerCase?.() ?? '');
    if (!token0 || !token1) return null;
    return { token0, token1 };
  }, [pairInfo, tokens]);

  const reserveSummary = useMemo(() => {
    if (!pairInfo || !pairTokens) return [];

    const formatReserve = (raw, tokenMeta) => {
      try {
        const value = Number.parseFloat(formatUnits(raw, tokenMeta.decimals ?? 18));
        if (!Number.isFinite(value)) return '--';
        return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
      } catch (error) {
        console.warn('Reserve format failed', error);
        return '--';
      }
    };

    return [
      {
        label: `${pairTokens.token0.symbol} reserve`,
        value: formatReserve(pairInfo.reserve0, pairTokens.token0)
      },
      {
        label: `${pairTokens.token1.symbol} reserve`,
        value: formatReserve(pairInfo.reserve1, pairTokens.token1)
      }
    ];
  }, [pairInfo, pairTokens]);

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
      showDialog({ title: 'Wallet required', message: 'Connect your wallet to start swapping.' });
      return;
    }
    if (!selectedTokens.pay || !selectedTokens.receive) {
      showDialog({ title: 'Select tokens', message: 'Choose both pay and receive tokens before swapping.' });
      return;
    }
    if (!payAmount || Number(payAmount) <= 0) {
      showDialog({ title: 'Enter amount', message: 'Provide a pay amount greater than zero.' });
      return;
    }
    if (!pairInfo || !pairContract?.address) {
      showDialog({ title: 'Pool unavailable', message: 'Pair information unavailable. Please refresh later.' });
      return;
    }
    if (expectedOut <= 0n) {
      showDialog({ title: 'Quote unavailable', message: 'Unable to derive an output amount. Check reserves or input.' });
      return;
    }
    if (insufficientBalance) {
      showDialog({ title: 'Insufficient balance', message: 'Your wallet balance is too low for this swap.' });
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
      showDialog({ title: 'Token mismatch', message: 'Selected tokens do not align with the configured pair.' });
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
    <XPWindow
      title="Swap Desk"
      icon="/logo/monad_rwa_logo.png"
      bodyClassName="p-0"
    >
      <div className="grid gap-4 p-6 lg:grid-cols-[minmax(0,420px)_minmax(0,260px)]">
        <div className="space-y-4">
          <div className="rounded border border-xpGray bg-white/95 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <header className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#0c3a94]">Token swap</h2>
              <span className="text-[11px] text-[#1b1b1b]">
                Balance:
                {' '}
                <strong>{formattedBalance}</strong>
              </span>
            </header>
            <div className="mt-3 space-y-3">
              <div className="rounded border border-[#94a3c4] bg-[#f3f7ff] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]">
                  <span>From wallet</span>
                  <button
                    type="button"
                    onClick={() => handleTokenPick('pay')}
                    className="text-[11px] font-semibold text-[#1c62d1] underline decoration-dotted hover:text-[#0b3b9e]"
                  >
                    Change
                  </button>
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => handleTokenPick('pay')}
                    className="flex items-center gap-2 rounded border border-[#7b8dbd] bg-white px-3 py-2 text-left text-sm font-semibold text-[#103c9c] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:border-[#1c62d1]"
                  >
                    {selectedTokens.pay ? (
                      <span className="flex flex-col leading-tight">
                        <span>{selectedTokens.pay.symbol}</span>
                        <span className="text-[11px] font-normal text-[#4b4b4b]">{selectedTokens.pay.name}</span>
                      </span>
                    ) : (
                      <span>Select token</span>
                    )}
                  </button>
                  <input
                    value={payAmount}
                    onChange={(event) => setPayAmount(event.target.value)}
                    placeholder="0.00"
                    inputMode="decimal"
                    className="w-full rounded border border-[#7b7b7b] bg-white px-3 py-2 text-right text-sm text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] focus:border-[#245edb] focus:outline-none"
                  />
                </div>
                <p className="mt-2 text-[11px] text-[#4b4b4b]">Wallet balance: {formattedBalance}</p>
              </div>

              <button
                type="button"
                onClick={handleSwitch}
                className="mx-auto flex items-center gap-2 rounded border border-[#7b8dbd] bg-gradient-to-b from-white to-[#dfe7ff] px-3 py-1 text-[12px] font-semibold text-[#0c3a94] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:border-[#1c62d1]"
              >
                ⇅ Swap order
              </button>

              <div className="rounded border border-[#94a3c4] bg-white px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0c3a94]">
                  <span>Receive in wallet</span>
                  <button
                    type="button"
                    onClick={() => handleTokenPick('receive')}
                    className="text-[11px] font-semibold text-[#1c62d1] underline decoration-dotted hover:text-[#0b3b9e]"
                  >
                    Change
                  </button>
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => handleTokenPick('receive')}
                    className="flex items-center gap-2 rounded border border-[#7b8dbd] bg-[#f5f5f5] px-3 py-2 text-left text-sm font-semibold text-[#103c9c] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:border-[#1c62d1]"
                  >
                    {selectedTokens.receive ? (
                      <span className="flex flex-col leading-tight">
                        <span>{selectedTokens.receive.symbol}</span>
                        <span className="text-[11px] font-normal text-[#4b4b4b]">{selectedTokens.receive.name}</span>
                      </span>
                    ) : (
                      <span>Select token</span>
                    )}
                  </button>
                  <div className="flex min-h-[40px] w-full items-center justify-end rounded border border-[#a9b3c9] bg-[#f4f4f4] px-3 py-2 text-sm font-semibold text-[#1b1b1b]">
                    {receivePreview}
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-[#4b4b4b]">Estimated output after 0.3% pool fee.</p>
              </div>
            </div>
            {insufficientBalance && (
              <p className="mt-3 rounded border border-[#d69ca1] bg-[#fef2f2] px-3 py-2 text-xs text-[#b91c1c]">
                Insufficient balance for this swap.
              </p>
            )}
            <button
              type="button"
              onClick={handleSwap}
              disabled={isSwapping}
              className="mt-4 w-full rounded border border-[#0b3b9e] bg-gradient-to-b from-[#5099ff] to-[#1c62d1] px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSwapping ? 'Swapping…' : 'Execute swap'}
            </button>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded border border-xpGray bg-white/90 p-4 text-[12px] text-[#1b1b1b] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
            <h3 className="text-[14px] font-semibold text-[#0c3a94]">Pool snapshot</h3>
            {reserveSummary.length ? (
              <ul className="mt-2 space-y-2">
                {reserveSummary.map((entry) => (
                  <li key={entry.label} className="flex items-center justify-between rounded border border-[#d0d7ea] bg-[#f3f7ff] px-3 py-2">
                    <span className="font-semibold text-[#0c3a94]">{entry.label}</span>
                    <span>{entry.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 rounded border border-dashed border-[#9aa6c5] bg-[#f8fbff] px-3 py-4 text-center text-[11px] text-[#4b4b4b]">
                Pool reserves load after the first on-chain sync.
              </p>
            )}
          </div>
        </aside>
      </div>
    </XPWindow>
  );
}
