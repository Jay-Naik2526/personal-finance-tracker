import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { 
    UserPlus, Check, Trash2, ArrowUpRight, ArrowDownLeft, QrCode, 
    Settings, ChevronDown, ChevronUp, Info, AlertCircle, Coins, 
    CheckCircle, X, ExternalLink, Copy 
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const DebtTracker = () => {
    const { user, loadUser } = useContext(AuthContext);
    const [debts, setDebts] = useState([]);
    const [form, setForm] = useState({ person: '', amount: '', type: 'owed_to' });
    
    // UI toggle states
    const [showUpiSettings, setShowUpiSettings] = useState(false);
    const [simplify, setSimplify] = useState(false);
    const [loadingSimplify, setLoadingSimplify] = useState(false);
    const [preFillAmount, setPreFillAmount] = useState(false);
    const [upiCopied, setUpiCopied] = useState(false);
    
    // Form for UPI settings
    const [upiForm, setUpiForm] = useState({ upiId: '', upiName: '' });
    const [upiMessage, setUpiMessage] = useState({ type: '', text: '' });
    const [loadingUpi, setLoadingUpi] = useState(false);
    
    // Modals
    const [qrDebt, setQrDebt] = useState(null); // Debt selected for UPI QR Code
    const [settlingDebt, setSettlingDebt] = useState(null); // Debt being settled
    const [settleRecordTransaction, setSettleRecordTransaction] = useState(true);
    const [settlePaymentSource, setSettlePaymentSource] = useState('Online');
    const [loadingSettle, setLoadingSettle] = useState(false);

    useEffect(() => { 
        fetchDebts(); 
        if (user) {
            setUpiForm({
                upiId: user.upiId || '',
                upiName: user.upiName || user.username || ''
            });
        }
    }, [user]);

    const fetchDebts = async () => { 
        try { 
            const r = await axios.get('/api/debts'); 
            setDebts(r.data); 
        } catch (e) { 
            console.error(e); 
        } 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { 
            await axios.post('/api/debts', form); 
            setForm({ person: '', amount: '', type: 'owed_to' }); 
            fetchDebts(); 
        } catch { 
            alert('Error saving'); 
        }
    };

    // Triggered when confirming the settlement modal
    const handleConfirmSettle = async () => {
        if (!settlingDebt) return;
        setLoadingSettle(true);
        try {
            await axios.patch(`/api/debts/${settlingDebt._id}`, { 
                status: 'settled',
                recordTransaction: settleRecordTransaction,
                paymentSource: settlePaymentSource
            });
            setSettlingDebt(null);
            fetchDebts();
        } catch (err) {
            alert('Error settling debt. Please try again.');
        } finally {
            setLoadingSettle(false);
        }
    };

    const deleteDebt = async (id) => { 
        if (window.confirm("Are you sure you want to delete this record?")) {
            try { 
                await axios.delete(`/api/debts/${id}`); 
                fetchDebts(); 
            } catch { 
                alert('Error deleting'); 
            } 
        }
    };

    const handleCopyUpiId = () => {
        if (!user?.upiId) return;
        navigator.clipboard.writeText(user.upiId);
        setUpiCopied(true);
        setTimeout(() => setUpiCopied(false), 2000);
    };

    // Save UPI settings
    const handleSaveUpi = async (e) => {
        e.preventDefault();
        setLoadingUpi(true);
        setUpiMessage({ type: '', text: '' });
        try {
            await axios.put('/api/auth/user', upiForm);
            await loadUser(); // Reload AuthContext state
            setUpiMessage({ type: 'success', text: 'UPI settings saved successfully!' });
            setTimeout(() => {
                setUpiMessage({ type: '', text: '' });
                setShowUpiSettings(false);
            }, 1500);
        } catch (err) {
            setUpiMessage({ type: 'error', text: 'Failed to update UPI settings.' });
        } finally {
            setLoadingUpi(false);
        }
    };

    // Simplify/consolidate duplicate debts in the database
    const handleConsolidateDebts = async () => {
        setLoadingSimplify(true);
        try {
            const res = await axios.post('/api/debts/simplify');
            setDebts(res.data);
            alert('Outstanding balances consolidated successfully!');
        } catch (err) {
            alert('Failed to consolidate balances.');
        } finally {
            setLoadingSimplify(false);
        }
    };

    // Process lists: separate into receivables and payables
    // Filter active (unsettled) ones to compute summary, show both on list
    const receivables = debts.filter(d => d.type === 'owed_by');
    const payables    = debts.filter(d => d.type === 'owed_to');
    
    const totalRec = receivables.filter(d => d.status !== 'settled').reduce((s, d) => s + d.amount, 0);
    const totalPay = payables.filter(d => d.status !== 'settled').reduce((s, d) => s + d.amount, 0);

    // Compute visual simplification (balances netting)
    const netBalancesData = useMemo(() => {
        const netBalancesByPerson = {};
        debts.filter(d => d.status !== 'settled').forEach(d => {
            const mult = d.type === 'owed_by' ? 1 : -1;
            if (!netBalancesByPerson[d.person]) {
                netBalancesByPerson[d.person] = 0;
            }
            netBalancesByPerson[d.person] += d.amount * mult;
        });

        const simplifiedRecs = [];
        const simplifiedPays = [];

        Object.entries(netBalancesByPerson).forEach(([person, net]) => {
            const rounded = Math.round(net * 100) / 100;
            if (rounded > 0.01) {
                simplifiedRecs.push({
                    _id: `temp-rec-${person}`,
                    person,
                    amount: rounded,
                    type: 'owed_by',
                    status: 'pending',
                    date: new Date(),
                    isSimplified: true
                });
            } else if (rounded < -0.01) {
                simplifiedPays.push({
                    _id: `temp-pay-${person}`,
                    person,
                    amount: -rounded,
                    type: 'owed_to',
                    status: 'pending',
                    date: new Date(),
                    isSimplified: true
                });
            }
        });

        return {
            receivables: simplifiedRecs,
            payables: simplifiedPays
        };
    }, [debts]);

    // Check if there are duplicate pending entries that can be consolidated
    const hasConsolidationNeed = useMemo(() => {
        const pending = debts.filter(d => d.status !== 'settled');
        const people = pending.map(d => d.person.toLowerCase());
        const uniquePeople = new Set(people).size;
        
        // If total count is greater than the number of unique people,
        // it means someone has multiple entries OR there is an overlapping debt (A owes You, You owe A).
        return pending.length > uniquePeople;
    }, [debts]);

    // Helpers to find corresponding real DB record ID for simplified rows
    const resolveDebtForSettlement = (row) => {
        if (!row.isSimplified) return row;
        
        // Find if there is exactly 1 pending debt in DB for this person
        const matchingPending = debts.filter(
            d => d.person.toLowerCase() === row.person.toLowerCase() && 
            d.type === row.type && 
            d.status === 'pending'
        );

        if (matchingPending.length === 1) {
            return matchingPending[0]; // Can settle directly
        }
        return null; // Needs db consolidation first
    };

    const handleSettleAction = (row) => {
        const target = resolveDebtForSettlement(row);
        if (target) {
            setSettlingDebt(target);
            setSettleRecordTransaction(true);
            setSettlePaymentSource('Online');
        } else {
            alert(`"${row.person}" has multiple pending transactions. Please click "Consolidate in DB" first to merge them into a single record before settling.`);
        }
    };

    const handleQrAction = (row) => {
        const target = resolveDebtForSettlement(row);
        if (target) {
            setQrDebt(target);
        } else {
            // Create a temp object just for QR generation (needs amount and person)
            setQrDebt({
                person: row.person,
                amount: row.amount
            });
        }
    };

    // Active displayed lists depending on simplification toggle
    const displayReceivables = simplify ? netBalancesData.receivables : receivables;
    const displayPayables = simplify ? netBalancesData.payables : payables;

    return (
        <div className="space-y-6 animate-fade-in-up">
            
            {/* Header */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="page-title">IOUs & Debts</h1>
                    <p className="text-sub text-sm mt-0.5">Track balances, generate payment links, and settle dues.</p>
                </div>
                <button 
                    onClick={() => setShowUpiSettings(!showUpiSettings)}
                    className="btn-ghost flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-bold shrink-0 text-ink self-start sm:self-auto border-border-strong hover:bg-raised"
                >
                    <Settings size={13} /> {showUpiSettings ? 'Hide UPI Settings' : 'Configure UPI Settings'}
                </button>
            </div>

            {/* Collapsible UPI settings */}
            {showUpiSettings && (
                <div className="card p-5 border border-ink/15 bg-zinc-50/50 animate-in">
                    <div className="flex items-center gap-2 mb-3">
                        <Coins size={15} className="text-ink" />
                        <h2 className="text-xs font-extrabold uppercase tracking-wider text-ink">UPI QR Code Settings</h2>
                    </div>
                    <p className="text-sub text-xs mb-4 leading-normal max-w-xl">
                        Save your UPI ID (VPA) and registered bank name. When friends owe you money, the app will generate a dynamic, amount-specific QR code they can scan to pay you directly.
                    </p>
                    <form onSubmit={handleSaveUpi} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="data-label block mb-1">Registered Name</label>
                            <input 
                                type="text" 
                                value={upiForm.upiName} 
                                onChange={(e) => setUpiForm({ ...upiForm, upiName: e.target.value })}
                                className="field-input w-full py-2 text-xs font-medium"
                                placeholder="e.g. Jay Naik"
                                required
                            />
                        </div>
                        <div>
                            <label className="data-label block mb-1">UPI ID (VPA)</label>
                            <input 
                                type="text" 
                                value={upiForm.upiId} 
                                onChange={(e) => setUpiForm({ ...upiForm, upiId: e.target.value })}
                                className="field-input w-full py-2 text-xs font-medium font-mono"
                                placeholder="username@upi"
                                required
                            />
                        </div>
                        <div className="flex items-end">
                            <button 
                                type="submit" 
                                disabled={loadingUpi}
                                className="btn-primary w-full py-2.5 rounded-xl transition-all text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                                {loadingUpi ? 'Saving...' : 'Save Details'}
                            </button>
                        </div>
                    </form>
                    {upiMessage.text && (
                        <div className={`mt-3 text-[11px] font-bold ${
                            upiMessage.type === 'success' ? 'text-pos' : 'text-neg'
                        }`}>
                            {upiMessage.text}
                        </div>
                    )}
                </div>
            )}

            {/* Quick stats cards */}
            {debts.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="card p-4 flex justify-between items-center" style={{ background: '#F0FDF4' }}>
                        <div>
                            <div className="label mb-1">To Receive</div>
                            <div className="num text-xl text-green-700">₹{totalRec.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-600"><ArrowDownLeft size={16} /></div>
                    </div>
                    <div className="card p-4 flex justify-between items-center" style={{ background: '#FEF2F2' }}>
                        <div>
                            <div className="label mb-1">To Pay</div>
                            <div className="num text-xl text-neg">₹{totalPay.toLocaleString('en-IN')}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-neg"><ArrowUpRight size={16} /></div>
                    </div>
                </div>
            )}

            {/* Record New Debt */}
            <div className="card p-5">
                <div className="label mb-4">Record New Debt</div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input 
                        type="text" 
                        value={form.person} 
                        onChange={(e) => setForm({ ...form, person: e.target.value })} 
                        className="field-input text-xs" 
                        placeholder="Friend name" 
                        required 
                    />
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sub text-xs">₹</span>
                        <input 
                            type="number" 
                            value={form.amount} 
                            onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                            className="field-input pl-8 w-full text-xs" 
                            placeholder="Amount" 
                            required 
                        />
                    </div>
                    <select 
                        value={form.type} 
                        onChange={(e) => setForm({ ...form, type: e.target.value })} 
                        className="field-input appearance-none text-xs bg-surface"
                    >
                        <option value="owed_to">I owe them</option>
                        <option value="owed_by">They owe me</option>
                    </select>
                    <button type="submit" className="bg-ink hover:bg-ink/85 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs">
                        <UserPlus size={14} /> Record Debt
                    </button>
                </form>
            </div>

            {/* Controls panel: Simplify toggle and Consolidation button */}
            {debts.filter(d => d.status !== 'settled').length > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-zinc-50 border border-border rounded-2xl">
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={simplify} 
                                onChange={(e) => setSimplify(e.target.checked)} 
                                className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-ink"></div>
                            <span className="ml-2 text-xs font-bold text-ink">Simplify Balances</span>
                        </label>
                        <span className="text-[10px] text-sub font-semibold bg-white px-2 py-0.5 border border-border rounded-full">
                            {simplify ? 'Net Balances ON' : 'Individual Debts'}
                        </span>
                    </div>

                    {hasConsolidationNeed && (
                        <button
                            onClick={handleConsolidateDebts}
                            disabled={loadingSimplify}
                            className="bg-white border border-border-strong hover:bg-raised text-ink text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-pill transition-all flex items-center gap-1"
                        >
                            <AlertCircle size={11} className="text-warn" /> {loadingSimplify ? 'Consolidating...' : 'Consolidate in DB'}
                        </button>
                    )}
                </div>
            )}

            {/* Receivable / Payable twin grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* They Owe You */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowDownLeft size={13} className="text-green-600" />
                        <span className="label text-green-700">They Owe You</span>
                        {simplify && <span className="text-[9px] font-bold uppercase bg-green-50 text-green-700 border border-green-100 rounded px-1.5 py-0.5">Net</span>}
                    </div>
                    <div className="space-y-2">
                        {displayReceivables.map(d => (
                            <DebtRow 
                                key={d._id} 
                                debt={d} 
                                onSettle={handleSettleAction} 
                                onDelete={deleteDebt}
                                onShowQr={handleQrAction}
                                hasUpi={!!user?.upiId}
                            />
                        ))}
                        {displayReceivables.length === 0 && (
                            <div className="card p-5 text-center text-sub text-xs border border-dashed border-border-strong">
                                Nobody owes you right now.
                            </div>
                        )}
                    </div>
                </div>

                {/* You Owe Them */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowUpRight size={13} className="text-neg" />
                        <span className="label text-neg">You Owe Them</span>
                        {simplify && <span className="text-[9px] font-bold uppercase bg-red-50 text-neg border border-red-100 rounded px-1.5 py-0.5">Net</span>}
                    </div>
                    <div className="space-y-2">
                        {displayPayables.map(d => (
                            <DebtRow 
                                key={d._id} 
                                debt={d} 
                                onSettle={handleSettleAction} 
                                onDelete={deleteDebt}
                            />
                        ))}
                        {displayPayables.length === 0 && (
                            <div className="card p-5 text-center text-sub text-xs border border-dashed border-border-strong">
                                You're debt free! 🎉
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* UPI QR Code Modal Overlay */}
            {qrDebt && (
                <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
                    <div className="bg-surface rounded-2xl shadow-float max-w-sm w-full p-6 text-center relative border border-border animate-slide-up-fast">
                        <button 
                            onClick={() => setQrDebt(null)}
                            className="absolute right-4 top-4 w-7 h-7 rounded-full bg-raised hover:bg-zinc-200 text-sub hover:text-ink flex items-center justify-center transition-all"
                        >
                            <X size={14} />
                        </button>
                        
                        <div className="w-11 h-11 rounded-xl bg-ink/5 border border-border flex items-center justify-center mx-auto text-ink mb-3.5"><QrCode size={20} /></div>
                        
                        <h3 className="text-sm font-extrabold text-ink">Scan & Pay</h3>
                        <p className="text-sub text-[11px] mt-0.5">Transfer directly via any UPI application.</p>

                        {!user?.upiId ? (
                            <div className="mt-5 p-4 rounded-xl border border-dashed border-border-strong bg-zinc-50/50 space-y-2.5 text-left">
                                <div className="text-xs text-ink font-bold flex items-center gap-1"><AlertCircle size={14} className="text-warn" /> UPI Not Configured</div>
                                <p className="text-[11px] text-sub leading-normal">Configure your UPI ID in settings above to generate payment QR codes dynamically.</p>
                                <button 
                                    onClick={() => { setQrDebt(null); setShowUpiSettings(true); }}
                                    className="w-full bg-ink text-white font-bold text-xs py-2 rounded-lg"
                                >
                                    Go to UPI Settings
                                </button>
                            </div>
                        ) : (
                            <div className="mt-5 space-y-4">
                                <div className="p-3 bg-zinc-100 rounded-2xl inline-block shadow-card">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(
                                            preFillAmount
                                            ? `upi://pay?pa=${user.upiId}&pn=${encodeURIComponent(user.upiName)}&am=${qrDebt.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Settle IOU - ${qrDebt.person}`)}`
                                            : `upi://pay?pa=${user.upiId}`
                                        )}`} 
                                        alt="UPI QR Code" 
                                        className="w-48 h-48 mx-auto rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-lg font-bold num text-ink">₹{qrDebt.amount.toLocaleString('en-IN')}</div>
                                    <div className="text-xs text-sub font-semibold">Paying <strong className="text-ink">{user.upiName}</strong></div>
                                    <div className="text-[9px] text-dim font-mono">{user.upiId}</div>
                                </div>
                                
                                <div className="pt-2.5 border-t border-border">
                                    <label className="flex items-center justify-center gap-2.5 cursor-pointer py-1">
                                        <input 
                                            type="checkbox" 
                                            checked={preFillAmount} 
                                            onChange={(e) => setPreFillAmount(e.target.checked)} 
                                            className="w-4 h-4 accent-ink rounded border-border-strong"
                                        />
                                        <span className="text-xs font-bold text-ink">Pre-fill amount (₹{qrDebt.amount.toLocaleString('en-IN')})</span>
                                    </label>
                                    <p className="text-[10px] text-sub max-w-[250px] mx-auto mt-1 leading-normal text-center">
                                        {preFillAmount 
                                            ? "⚠️ Some banks block P2P transfers with pre-filled amounts for security. If scanning fails, uncheck this."
                                            : "Friend enters the amount manually after scanning. (Highly recommended to prevent bank blocks)."}
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-border mt-3 text-left">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleCopyUpiId}
                                            className="flex-1 btn-ghost py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                                        >
                                            {upiCopied ? <Check size={12} className="text-pos stroke-[3]" /> : <Copy size={12} />}
                                            {upiCopied ? "Copied VPA!" : "Copy UPI ID"}
                                        </button>
                                        
                                        <a 
                                            href={preFillAmount
                                                ? `upi://pay?pa=${user.upiId}&pn=${encodeURIComponent(user.upiName)}&am=${qrDebt.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Settle IOU - ${qrDebt.person}`)}`
                                                : `upi://pay?pa=${user.upiId}`
                                            }
                                            className="flex-1 btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5 text-center"
                                        >
                                            <ExternalLink size={12} /> Pay on Mobile
                                        </a>
                                    </div>
                                    <p className="text-[9px] text-dim leading-normal text-center mt-1.5">
                                        Note: Bank apps (like IndusInd) sometimes restrict web QR codes. If scanning fails, try scanning with <strong>Google Pay / PhonePe / Paytm</strong>, copy the UPI ID, or tap "Pay on Mobile".
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Settlement Dialog Modal */}
            {settlingDebt && (
                <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
                    <div className="bg-surface rounded-2xl shadow-float max-w-sm w-full p-5 relative border border-border text-left animate-slide-up-fast">
                        <button 
                            onClick={() => setSettlingDebt(null)}
                            className="absolute right-4 top-4 w-7 h-7 rounded-full bg-raised hover:bg-zinc-200 text-sub hover:text-ink flex items-center justify-center transition-all"
                        >
                            <X size={14} />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-4 border-b border-border pb-3">
                            <div className="w-9 h-9 rounded-xl bg-ink/5 border border-border flex items-center justify-center text-ink"><CheckCircle size={16} /></div>
                            <div>
                                <h3 className="text-sm font-extrabold text-ink">Confirm Settlement</h3>
                                <p className="text-[11px] text-sub">Settle pending debt record.</p>
                            </div>
                        </div>

                        <div className="space-y-3.5 mb-5">
                            <div className="p-3 bg-zinc-50 border border-border rounded-xl flex justify-between items-center">
                                <span className="text-xs font-semibold text-ink">{settlingDebt.person}</span>
                                <span className={`text-xs font-bold ${
                                    settlingDebt.type === 'owed_by' ? 'text-pos' : 'text-neg'
                                }`}>
                                    {settlingDebt.type === 'owed_by' ? 'Owes you' : 'You owe'} ₹{settlingDebt.amount.toLocaleString('en-IN')}
                                </span>
                            </div>

                            {/* Transaction Logger Checkbox */}
                            <label className="flex items-start gap-2.5 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={settleRecordTransaction}
                                    onChange={(e) => setSettleRecordTransaction(e.target.checked)}
                                    className="w-4 h-4 accent-ink rounded mt-0.5 border-border-strong"
                                />
                                <div>
                                    <div className="text-xs text-ink font-bold">Auto-record in Transactions ledger</div>
                                    <p className="text-[10px] text-sub mt-0.5 leading-normal">Create an account transaction entry (Income/Expense) to balance your books automatically.</p>
                                </div>
                            </label>

                            {/* Transaction Source Selection */}
                            {settleRecordTransaction && (
                                <div className="space-y-1.5 p-3 rounded-xl border border-border bg-zinc-50/50 animate-in">
                                    <span className="data-label">Payment Source</span>
                                    <div className="flex gap-2">
                                        {['Online', 'Cash'].map(src => (
                                            <button
                                                key={src}
                                                type="button"
                                                onClick={() => setSettlePaymentSource(src)}
                                                className={`flex-1 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                                                    settlePaymentSource === src 
                                                    ? 'bg-ink text-white border-ink shadow-pill' 
                                                    : 'bg-white text-sub hover:text-ink border-border'
                                                }`}
                                            >
                                                {src}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setSettlingDebt(null)}
                                className="flex-1 py-2.5 border border-border rounded-xl text-xs font-bold text-sub hover:text-ink transition-all text-center"
                                disabled={loadingSettle}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmSettle}
                                className="flex-1.5 py-2.5 bg-ink hover:bg-neutral-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1"
                                disabled={loadingSettle}
                            >
                                {loadingSettle ? 'Saving...' : 'Mark Settle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DebtRow = ({ debt, onSettle, onDelete, onShowQr, hasUpi }) => {
    const isReceivable = debt.type === 'owed_by';
    const isSettled    = debt.status === 'settled';
    const tintBg = isReceivable ? '#F0FDF4' : '#FEF2F2';
    const color  = isReceivable ? '#16A34A' : '#DC2626';

    return (
        <div className={`card px-4 py-3.5 flex items-center justify-between group ${
            isSettled ? 'opacity-40' : ''
        }`} style={{ background: tintBg }}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 bg-white/85 shadow-pill"
                    style={{ color }}>
                    {debt.person.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                    <div className="text-ink text-sm font-semibold flex items-center gap-1.5">
                        <span>{debt.person}</span>
                        {debt.isSimplified && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-sub bg-white border border-border px-1.5 rounded-full">Net</span>
                        )}
                    </div>
                    <div className="text-sub text-[10px] flex items-center gap-1.5 mt-0.5">
                        <span>{new Date(debt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        {isSettled && <span className="chip-green py-0.5 px-2 text-[9px]">Settled</span>}
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="num text-sm font-bold" style={{ color }}>₹{debt.amount.toLocaleString('en-IN')}</span>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isSettled && (
                        <>
                            {onShowQr && (
                                <button 
                                    onClick={() => onShowQr(debt)}
                                    className={`w-7.5 h-7.5 p-2 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-pill transition-all border ${
                                        hasUpi ? 'text-ink border-ink/10' : 'text-dim border-border'
                                    }`}
                                    title="Show UPI QR Code"
                                >
                                    <QrCode size={13} />
                                </button>
                            )}
                            <button 
                                onClick={() => onSettle(debt)}
                                className="w-7.5 h-7.5 p-2 rounded-xl bg-white border border-green-150 text-green-600 flex items-center justify-center hover:bg-green-100/50 hover:shadow-pill transition-all"
                                title="Mark as Settled"
                            >
                                <Check size={13} className="stroke-[3]" />
                            </button>
                        </>
                    )}
                    <button 
                        onClick={() => onDelete(debt._id)}
                        className="w-7.5 h-7.5 p-2 rounded-xl bg-white border border-red-150 text-dim hover:text-neg hover:bg-red-50 hover:shadow-pill flex items-center justify-center transition-all"
                        title="Delete Entry"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DebtTracker;
