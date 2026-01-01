import React, { useState } from 'react';
import { Wallet, ArrowRightLeft, Edit2, Check, X, CreditCard } from 'lucide-react';
import axios from 'axios';

const WalletCard = ({ type, balance, onUpdate }) => {
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [newBalance, setNewBalance] = useState('');
    const [loading, setLoading] = useState(false);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) return;
        setLoading(true);

        try {
            const date = new Date();
            // Withdrawal: Online -> Cash
            await axios.post('/api/transactions', {
                amount: Number(amount),
                type: 'expense',
                category: 'Transfer',
                source: 'Online',
                description: 'Withdrawal to Cash',
                date
            });

            await axios.post('/api/transactions', {
                amount: Number(amount),
                type: 'income',
                category: 'Transfer',
                source: 'Cash',
                description: 'Withdrawal from Online',
                date
            });

            setIsWithdrawOpen(false);
            setAmount('');
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error(err);
            alert('Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    const handleBalanceUpdate = async (e) => {
        e.preventDefault();
        if (newBalance === '') return;
        setLoading(true);

        try {
            // Calculate difference
            const currentBal = Number(balance);
            const targetBal = Number(newBalance);
            const diff = targetBal - currentBal;

            if (diff !== 0) {
                await axios.post('/api/transactions', {
                    amount: Math.abs(diff),
                    type: diff > 0 ? 'income' : 'expense', // Positive diff = Income, Negative = Expense
                    category: 'Balance Adjustment',
                    source: type,
                    description: 'Manual Balance Correction',
                    date: new Date()
                });
            }

            setIsEditOpen(false);
            setNewBalance('');
            if (onUpdate) onUpdate();

        } catch (err) {
            console.error(err);
            alert('Update failed');
        } finally {
            setLoading(false);
        }
    };

    const gradientClass = type === 'Cash'
        ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/20'
        : 'bg-gradient-to-br from-blue-500/20 via-blue-500/5 to-transparent border-blue-500/20';

    const iconClass = type === 'Cash' ? 'text-emerald-400 bg-emerald-400/10' : 'text-blue-400 bg-blue-400/10';

    return (
        <div className={`glass-card relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:border-white/20 hover:-translate-y-1 ${gradientClass}`}>
            {/* Decorative Blur */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${type === 'Cash' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>

            <div className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${iconClass}`}>
                            {type === 'Cash' ? <Wallet size={24} /> : <CreditCard size={24} />}
                        </div>
                        <div>
                            <h3 className="text-muted text-sm font-medium uppercase tracking-wider">{type} Balance</h3>
                            <div className="text-xs text-muted/50">Last updated: Just now</div>
                        </div>
                    </div>
                    <button
                        onClick={() => { setNewBalance(balance); setIsEditOpen(true); }}
                        className="p-2 rounded-lg text-muted/50 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Edit Balance"
                    >
                        <Edit2 size={16} />
                    </button>
                </div>

                <div className="mb-6">
                    <div className="text-4xl font-bold text-white tracking-tight flex items-baseline">
                        <span className="text-2xl mr-1 opacity-60">₹</span>
                        {balance.toLocaleString()}
                    </div>
                </div>

                {type === 'Online' && (
                    <button
                        onClick={() => setIsWithdrawOpen(true)}
                        className="w-full py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium text-sm flex items-center justify-center gap-2 border border-blue-500/20 transition-all hover:shadow-lg hover:shadow-blue-500/10 active:scale-95"
                    >
                        <ArrowRightLeft size={16} />
                        Withdraw to Cash
                    </button>
                )}
            </div>

            {/* Edit Balance Modal */}
            {isEditOpen && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col justify-center p-6 z-20 animate-in fade-in zoom-in duration-200">
                    <h4 className="text-sm text-muted mb-4 uppercase tracking-wider font-bold">Update {type} Balance</h4>
                    <form onSubmit={handleBalanceUpdate}>
                        <input
                            type="number"
                            value={newBalance}
                            onChange={(e) => setNewBalance(e.target.value)}
                            className="w-full bg-transparent text-3xl font-bold text-white border-b-2 border-primary/50 focus:border-primary outline-none py-2 mb-6 placeholder-white/10"
                            placeholder="0.00"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors shadow-lg shadow-primary/20">
                                {loading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Withdraw Modal */}
            {isWithdrawOpen && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col justify-center p-6 z-20 animate-in fade-in zoom-in duration-200">
                    <h4 className="text-sm text-muted mb-4 uppercase tracking-wider font-bold">Withdraw Amount</h4>
                    <form onSubmit={handleWithdraw}>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-transparent text-3xl font-bold text-white border-b-2 border-blue-500/50 focus:border-blue-500 outline-none py-2 mb-6 placeholder-white/10"
                            placeholder="0.00"
                            autoFocus
                        />
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsWithdrawOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-colors shadow-lg shadow-blue-500/20">
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default WalletCard;
