import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Check, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const DebtTracker = () => {
    const [debts, setDebts] = useState([]);
    const [form, setForm] = useState({ person: '', amount: '', type: 'owed_to' });

    useEffect(() => {
        fetchDebts();
    }, []);

    const fetchDebts = async () => {
        try {
            const res = await axios.get('/api/debts');
            setDebts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/debts', form);
            setForm({ person: '', amount: '', type: 'owed_to' });
            fetchDebts();
        } catch (err) {
            alert('Error saving debt');
        }
    };

    const settleDebt = async (id) => {
        try {
            await axios.patch(`/api/debts/${id}`, { status: 'settled' });
            fetchDebts();
        } catch (err) {
            alert('Error updating debt');
        }
    };

    const deleteDebt = async (id) => {
        try {
            await axios.delete(`/api/debts/${id}`);
            fetchDebts();
        } catch (err) {
            alert('Error deleting debt');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">IOUs & Debts</h2>
                <p className="text-muted">Track who owes you and who you owe.</p>
            </header>

            <form onSubmit={handleSubmit} className="glass-card p-6 flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                    <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Name</label>
                    <input
                        type="text"
                        value={form.person}
                        onChange={(e) => setForm({ ...form, person: e.target.value })}
                        className="glass-input w-full"
                        placeholder="e.g. John Doe"
                        required
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Amount</label>
                    <input
                        type="number"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        className="glass-input w-full"
                        placeholder="0.00"
                        required
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Type</label>
                    <select
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="glass-input w-full appearance-none"
                    >
                        <option value="owed_to" className="bg-slate-900">I owe them</option>
                        <option value="owed_by" className="bg-slate-900">They owe me</option>
                    </select>
                </div>
                <button type="submit" className="w-full md:w-auto glass-button p-3 flex justify-center items-center h-[50px] w-[50px] !px-0 rounded-xl">
                    <UserPlus size={20} />
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ArrowDownLeft size={16} /> Receivables
                    </h3>
                    <div className="space-y-4">
                        {debts.filter(d => d.type === 'owed_by').map(debt => (
                            <DebtCard key={debt._id} debt={debt} onSettle={settleDebt} onDelete={deleteDebt} />
                        ))}
                        {debts.filter(d => d.type === 'owed_by').filter(d => d.status !== 'settled').length === 0 && (
                            <div className="p-6 rounded-xl border border-white/5 bg-white/5 text-center text-muted text-sm italic">
                                Nobody owes you money right now.
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ArrowUpRight size={16} /> Payables
                    </h3>
                    <div className="space-y-4">
                        {debts.filter(d => d.type === 'owed_to').map(debt => (
                            <DebtCard key={debt._id} debt={debt} onSettle={settleDebt} onDelete={deleteDebt} />
                        ))}
                        {debts.filter(d => d.type === 'owed_to').filter(d => d.status !== 'settled').length === 0 && (
                            <div className="p-6 rounded-xl border border-white/5 bg-white/5 text-center text-muted text-sm italic">
                                You are debt free! 🎉
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DebtCard = ({ debt, onSettle, onDelete }) => (
    <div className={`p-5 rounded-2xl border transition-all duration-300 ${debt.status === 'settled'
            ? 'bg-black/20 border-white/5 opacity-50 grayscale'
            : 'glass-card'
        }`}>
        <div className="flex justify-between items-center">
            <div>
                <div className="font-bold text-white text-lg">{debt.person}</div>
                <div className="text-xs text-muted mb-2">{new Date(debt.date).toLocaleDateString()}</div>
                <div className={`text-2xl font-bold font-mono tracking-tight ${debt.type === 'owed_by' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{debt.amount.toLocaleString()}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                {debt.status === 'pending' && (
                    <button
                        onClick={() => onSettle(debt._id)}
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-lg transition-colors"
                        title="Mark Settled"
                    >
                        <Check size={18} />
                    </button>
                )}
                <button
                    onClick={() => onDelete(debt._id)}
                    className="p-2 bg-white/5 hover:bg-rose-500/20 text-muted hover:text-rose-500 border border-white/5 hover:border-rose-500/20 rounded-lg transition-colors"
                    title="Delete"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
        {debt.status === 'settled' && (
            <div className="mt-2 text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                <Check size={12} /> Settled
            </div>
        )}
    </div>
);

export default DebtTracker;
