import React, { useState } from 'react';
import { Wallet, ArrowRightLeft, Edit2, CreditCard, X } from 'lucide-react';
import axios from 'axios';

const WalletCard = ({ type, balance, onUpdate }) => {
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [newBalance, setNewBalance] = useState('');
    const [loading, setLoading] = useState(false);

    const isCash = type === 'Cash';
    const Icon = isCash ? Wallet : CreditCard;
    const tintBg    = isCash ? '#F0FDF4' : '#EFF6FF';
    const iconBg    = isCash ? 'bg-green-100' : 'bg-blue-100';
    const iconColor = isCash ? 'text-green-600' : 'text-blue-600';
    const accentColor = isCash ? '#16A34A' : '#2563EB';

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return;
        setLoading(true);
        try {
            const date = new Date();
            await axios.post('/api/transactions', { amount: Number(amount), type: 'expense', category: 'Transfer', source: 'Online', description: 'Withdrawal to Cash', date });
            await axios.post('/api/transactions', { amount: Number(amount), type: 'income',  category: 'Transfer', source: 'Cash',   description: 'Withdrawal from Online', date });
            setIsWithdrawOpen(false); setAmount('');
            if (onUpdate) onUpdate();
        } catch { alert('Transfer failed'); }
        finally { setLoading(false); }
    };

    const handleBalanceUpdate = async (e) => {
        e.preventDefault();
        if (newBalance === '') return;
        setLoading(true);
        try {
            const diff = Number(newBalance) - Number(balance);
            if (diff !== 0) {
                await axios.post('/api/transactions', {
                    amount: Math.abs(diff), type: diff > 0 ? 'income' : 'expense',
                    category: 'Balance Adjustment', source: type,
                    description: 'Manual Balance Correction', date: new Date(),
                });
            }
            setIsEditOpen(false); setNewBalance('');
            if (onUpdate) onUpdate();
        } catch { alert('Update failed'); }
        finally { setLoading(false); }
    };

    return (
        <div className="card p-5 relative overflow-hidden group h-full flex flex-col" style={{ background: tintBg }}>
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`icon-box ${iconBg} ${iconColor}`}>
                        <Icon size={16} />
                    </div>
                    <div>
                        <div className="label">{type} Wallet</div>
                        <div className="text-ink text-sm font-semibold mt-0.5">{isCash ? 'Physical cash' : 'UPI / Bank'}</div>
                    </div>
                </div>
                <button
                    onClick={() => { setNewBalance(balance); setIsEditOpen(true); }}
                    className="w-8 h-8 rounded-xl bg-white/70 text-dim hover:text-ink flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    title="Edit balance"
                >
                    <Edit2 size={13} />
                </button>
            </div>

            <div className="flex-1 mb-4">
                <div className="flex items-baseline gap-0.5">
                    <span className="text-sub text-base font-semibold">₹</span>
                    <span className="num text-[2rem] leading-none text-ink">
                        {balance.toLocaleString('en-IN')}
                    </span>
                </div>
            </div>

            {!isCash && (
                <button
                    onClick={() => setIsWithdrawOpen(true)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 bg-white/80 hover:bg-white text-ink border border-white/60 transition-all"
                >
                    <ArrowRightLeft size={12} />
                    Withdraw to Cash
                </button>
            )}

            {/* Edit Overlay */}
            {isEditOpen && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col justify-center p-5 rounded-2xl z-20 animate-in">
                    <div className="flex items-center justify-between mb-4">
                        <div className="label">Update {type} Balance</div>
                        <button onClick={() => setIsEditOpen(false)} className="text-dim hover:text-ink transition-colors"><X size={14} /></button>
                    </div>
                    <form onSubmit={handleBalanceUpdate}>
                        <div className="relative mb-5">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sub text-lg">₹</span>
                            <input
                                type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)}
                                className="w-full bg-transparent num text-3xl text-ink border-b-2 border-border focus:border-ink outline-none py-1.5 pl-6 placeholder-dim transition-colors"
                                placeholder="0" autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-2.5 rounded-xl bg-raised hover:bg-border text-ink text-sm font-medium transition-all">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-ink hover:bg-ink/85 disabled:opacity-50 text-white text-sm font-semibold transition-all">{loading ? 'Saving…' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Withdraw Overlay */}
            {isWithdrawOpen && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col justify-center p-5 rounded-2xl z-20 animate-in">
                    <div className="flex items-center justify-between mb-4">
                        <div className="label">Withdraw Amount</div>
                        <button onClick={() => setIsWithdrawOpen(false)} className="text-dim hover:text-ink transition-colors"><X size={14} /></button>
                    </div>
                    <form onSubmit={handleWithdraw}>
                        <div className="relative mb-5">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sub text-lg">₹</span>
                            <input
                                type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-transparent num text-3xl text-ink border-b-2 border-border focus:border-ink outline-none py-1.5 pl-6 placeholder-dim transition-colors"
                                placeholder="0" autoFocus
                            />
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsWithdrawOpen(false)} className="flex-1 py-2.5 rounded-xl bg-raised hover:bg-border text-ink text-sm font-medium transition-all">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-ink hover:bg-ink/85 disabled:opacity-50 text-white text-sm font-semibold transition-all">{loading ? 'Processing…' : 'Confirm'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default WalletCard;
