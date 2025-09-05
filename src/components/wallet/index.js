import React, { useEffect, useMemo, useState } from "react";
import Web3 from "web3";
import { QRCodeCanvas } from "qrcode.react";
import { CHAIN_PARAMS, getChainName, switchOrAddChain } from "../../libs/network";
import { saveSession, loadSession, clearSession } from "../../libs/storage";

/**
 * Basic ETH Wallet (Web3.js) — Bootstrap version
 * - Connect via MetaMask
 * - Persist session (account/chain) in localStorage
 * - Show network, account, balance
 * - Manual Refresh + Network switch dropdown
 * - Receive (address + QR)
 * - Send ETH form
 * - Status auto-clears after 7s
 * - Polling-only (no websockets)
 */
export default function Web3Wallet() {
    const [web3, setWeb3] = useState(null);
    const [account, setAccount] = useState("");
    const [chainId, setChainId] = useState("");
    const [balanceEth, setBalanceEth] = useState("0");
    const [to, setTo] = useState("");
    const [amountEth, setAmountEth] = useState("");
    const [status, setStatus] = useState("");
    const [selectedChain, setSelectedChain] = useState("0x1");

    const provider = useMemo(() => {
        if (typeof window !== "undefined" && window.ethereum) return window.ethereum;
        return null;
    }, []);

    const connect = async () => {
        try {
            if (!provider) throw new Error("MetaMask not found. Please install it.");
            const accs = await provider.request({ method: "eth_requestAccounts" });
            const cid = await provider.request({ method: "eth_chainId" });

            const first = accs[0] || "";
            setAccount(first);
            setChainId(cid);
            setSelectedChain(cid);

            const _web3 = new Web3(provider);
            setWeb3(_web3);

            saveSession(first, cid);
            setStatus("Connected");
        } catch (err) {
            setStatus(err?.message || "Connect failed");
        }
    };

    const refreshBalance = async () => {
        if (!web3 || !account) return;
        try {
            const wei = await web3.eth.getBalance(account);
            // Convert Wei → Ether
            const ethValue = parseFloat(web3.utils.fromWei(wei, "ether"));
            // Always round DOWN to 6 decimal places
            const rounded = Math.floor(ethValue * 1e6) / 1e6;
            setBalanceEth(rounded);
        } catch {
            setStatus("Failed to fetch balance");
        }
    };

    // MetaMask events
    useEffect(() => {
        if (!provider) return;

        const onAccountsChanged = (accs) => {
            const first = accs[0] || "";
            setAccount(first);
            if (!first) {
                clearSession();
                setStatus("Disconnected");
                setBalanceEth("0");
            } else {
                saveSession(first, chainId);
                setStatus("Account changed");
            }
        };

        const onChainChanged = (cid) => {
            setChainId(cid);
            setSelectedChain(cid);
            saveSession(account, cid);
            setStatus("Network changed");
            refreshBalance();
        };

        provider.on?.("accountsChanged", onAccountsChanged);
        provider.on?.("chainChanged", onChainChanged);
        return () => {
            provider.removeListener?.("accountsChanged", onAccountsChanged);
            provider.removeListener?.("chainChanged", onChainChanged);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider, account, chainId]);

    // Auto-reconnect
    useEffect(() => {
        const { account: savedAccount, chainId: savedChain } = loadSession();
        if (!provider || !savedAccount) return;

        provider.request({ method: "eth_accounts" }).then((accounts) => {
            if (accounts.includes(savedAccount)) {
                setAccount(savedAccount);
                setChainId(savedChain || "");
                setSelectedChain(savedChain || "0x1");
                setWeb3(new Web3(provider));
            } else {
                clearSession();
            }
        });
    }, [provider]);

    // Auto-clear status after 7s
    useEffect(() => {
        if (!status) return;
        const timer = setTimeout(() => setStatus(""), 7000);
        return () => clearTimeout(timer);
    }, [status]);

    // Switch network
    const handleChangeNetwork = async (e) => {
        const hexId = e.target.value;
        if (!provider) return setStatus("MetaMask not found");
        try {
            setStatus("Switching network…");
            await switchOrAddChain(provider, hexId);
            setSelectedChain(hexId);
            setStatus(`Switched to ${getChainName(hexId)}`);
        } catch (err) {
            setStatus(err?.message || "Failed to switch network");
        }
    };

    // Send ETH
    const sendEth = async (e) => {
        e.preventDefault();
        if (!web3 || !account) return setStatus("Connect wallet first");
        try {
            if (!web3.utils.isAddress(to)) throw new Error("Invalid recipient address");
            const amt = Number(amountEth);
            if (!amountEth || !Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");

            setStatus("Sending…");
            const tx = { from: account, to, value: web3.utils.toWei(amountEth, "ether") };
            const receipt = await web3.eth.sendTransaction(tx);
            setStatus(`Sent! Tx: ${receipt?.transactionHash || "(pending)"}`);
            setTo(""); setAmountEth("");
            refreshBalance();
        } catch (err) {
            setStatus(err?.message || "Send failed");
        }
    };

    return (
        <div className="wallet_section layout_padding">
            <div className="container py-4">
                <h2 className="mb-3">Basic ETH Wallet (Web3.js)</h2>

                {status ? (
                    <div className="alert alert-info" role="alert">
                        <strong>Status: </strong>{status}
                    </div>
                ) : null}

                {!account ? (
                    <button className="btn btn-primary" onClick={connect}>Connect MetaMask</button>
                ) : (
                    <>
                        <div className="card mb-3">
                            <div className="card-body">
                                <div className="mb-2"><strong>Network:</strong> {getChainName(chainId)}</div>
                                <div className="mb-2">
                                    <strong>Account:</strong> <code className="text-break">{account}</code>
                                </div>
                                <div className="mb-3"><strong>Balance:</strong> {balanceEth} ETH</div>

                                <div className="d-flex flex-wrap align-items-center gap-2">
                                    <button className="btn btn-outline-secondary btn-sm" onClick={refreshBalance}>
                                        Refresh
                                    </button>

                                    <label className="form-label mb-0">
                                        Network:&nbsp;
                                        <select
                                            className="form-select form-select-sm d-inline-block"
                                            style={{ width: 220 }}
                                            value={selectedChain}
                                            onChange={handleChangeNetwork}
                                            aria-label="Select EVM Network"
                                        >
                                            {Object.keys(CHAIN_PARAMS).map((key) => (
                                                <option key={key} value={key}>{CHAIN_PARAMS[key].chainName}</option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="card mb-3">
                            <div className="card-body">
                                <h4 className="h6">Receive ETH</h4>
                                <div className="row g-3 align-items-center">
                                    <div className="col-auto">
                                        <QRCodeCanvas value={account} size={128} />
                                    </div>
                                    <div className="col">
                                        <div className="mb-1"><strong>Your Address</strong></div>
                                        <code className="text-break d-inline-block">{account}</code>
                                        <div className="text-muted small">Share this to receive ETH</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card mb-3">
                            <div className="card-body">
                                <h4 className="h6">Send ETH</h4>
                                <form onSubmit={sendEth} className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label">To (0x…)</label>
                                        <input
                                            className="form-control"
                                            value={to}
                                            onChange={(e) => setTo(e.target.value)}
                                            placeholder="0xRecipient"
                                            spellCheck="false"
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                        />
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label">Amount (ETH)</label>
                                        <input
                                            className="form-control"
                                            value={amountEth}
                                            onChange={(e) => setAmountEth(e.target.value)}
                                            placeholder="0.01"
                                            inputMode="decimal"
                                        />
                                    </div>
                                    <div className="col-12 d-flex gap-2">
                                        <button className="btn btn-primary" type="submit">Send</button>
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() => { setTo(""); setAmountEth(""); }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                </form>
                                <div className="text-muted small mt-2">
                                    Gas fees are paid in ETH. Ensure sufficient balance.
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="text-muted small mt-2">
                    Tip: For testnets, switch network in MetaMask and use a faucet.
                </div>
            </div>
        </div>
    );
}
