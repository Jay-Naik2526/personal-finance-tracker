import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const SavingsJars = () => {
    const [jars, setJars] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', targetAmount: '', emoji: '💰' });

    const [activeJar, setActiveJar] = useState(null); // Jar being edited
    const [transactionType, setTransactionType] = useState('add'); // 'add' or 'withdraw'
    const [transactionAmount, setTransactionAmount] = useState('');
    const [transactionSource, setTransactionSource] = useState('Online');

    useEffect(() => {
        fetchJars();
    }, []);

    const fetchJars = async () => {
        try {
            const res = await axios.get('/api/savings');
            setJars(res.data);
        } catch (err) { console.error(err); }
    };

    const createJar = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/savings', form);
            fetchJars();
            setShowForm(false);
            setForm({ name: '', targetAmount: '', emoji: '💰' });
        } catch (err) { alert('Error creating jar'); }
    };

    const openTransactionModal = (jar, type) => {
        setActiveJar(jar);
        setTransactionType(type);
        setTransactionAmount('');
        setTransactionSource('Online');
    };

    const handleTransactionSubmit = async () => {
        if (!transactionAmount || Number(transactionAmount) <= 0) return;

        try {
            const amount = transactionType === 'add' ? Number(transactionAmount) : -Number(transactionAmount);
            await axios.patch(`/api/savings/${activeJar._id}/add`, {
                amount,
                source: transactionSource
            });
            fetchJars();
            setActiveJar(null);
        } catch (err) {
            console.error(err);
            alert('Transaction failed');
        }
    };

    const deleteJar = async (id) => {
        if (!window.confirm('Smash this jar?')) return;
        try {
            await axios.delete(`/api/savings/${id}`);
            fetchJars();
        } catch (err) { alert('Error deleting'); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Dream Jars</h2>
                    <p className="text-muted">Save up for the things that matter.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="glass-button px-4 py-2 flex items-center gap-2"
                >
                    <Plus size={18} /> New Jar
                </button>
            </header>

            {showForm && (
                <form onSubmit={createJar} className="glass-card p-6 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            placeholder="Goal Name (e.g. MacBook)"
                            className="glass-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                        />
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-white/50">₹</span>
                            <input
                                type="number"
                                placeholder="Target Amount"
                                className="glass-input pl-8"
                                value={form.targetAmount}
                                onChange={e => setForm({ ...form, targetAmount: e.target.value })}
                                required
                            />
                        </div>
                        <select
                            className="glass-input"
                            value={form.emoji}
                            onChange={e => setForm({ ...form, emoji: e.target.value })}
                        >
                            <option value="💰">💰 Money Bag</option>
                            <option value="💻">💻 Laptop</option>
                            <option value="🚗">🚗 Car</option>
                            <option value="✈️">✈️ Travel</option>
                            <option value="🎸">🎸 Guitar</option>
                            <option value="🎓">🎓 Education</option>
                        </select>
                        <button type="submit" className="glass-button bg-gradient-to-r from-pink-500 to-rose-500 border-none shadow-lg shadow-pink-500/20">
                            Create Jar
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {jars.map(jar => {
                    const percentage = Math.min(100, Math.round((jar.currentAmount / jar.targetAmount) * 100));
                    return (
                        <div key={jar._id} className="glass-card p-8 relative group overflow-hidden flex flex-col items-center text-center">

                            {/* Progress Circle Background */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                                <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                            </div>

                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => deleteJar(jar._id)} className="text-white/20 hover:text-rose-400 p-2">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="w-24 h-24 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center text-5xl mb-4 shadow-inner shadow-black/20 relative">
                                {jar.emoji}
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400/50 rotate-45"></div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-1">{jar.name}</h3>
                            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-cyan-200 mb-4">
                                ₹{jar.currentAmount.toLocaleString()} <span className="text-sm text-muted font-normal">/ ₹{jar.targetAmount.toLocaleString()}</span>
                            </div>

                            <div className="flex gap-4 w-full mt-auto">
                                <button
                                    onClick={() => openTransactionModal(jar, 'withdraw')}
                                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-rose-300 text-sm font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                    <ArrowDownCircle size={14} /> Withdraw
                                </button>
                                <button
                                    onClick={() => openTransactionModal(jar, 'add')}
                                    className="flex-1 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-sm font-medium transition-colors flex items-center justify-center gap-1 border border-cyan-500/20"
                                >
                                    <ArrowUpCircle size={14} /> Add Money
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {jars.length === 0 && !showForm && (
                <div className="text-center py-20">
                    <div className="w-20 h-20 rounded-full bg-white/5 mx-auto flex items-center justify-center mb-4 text-4xl">🌱</div>
                    <p className="text-muted">Start a small savings jar today.</p>
                </div>
            )}
            {/* Transaction Modal */}
            {activeJar && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col justify-center items-center p-4 z-50 animate-in fade-in zoom-in duration-200">
                    <div className="glass-card p-6 w-full max-w-sm">
                        <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            {transactionType === 'add' ? <ArrowUpCircle className="text-cyan-400" /> : <ArrowDownCircle className="text-rose-400" />}
                            {transactionType === 'add' ? 'Add to Jar' : 'Withdraw'}
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs uppercase text-muted font-bold tracking-wider">Amount</label>
                                <input
                                    type="number"
                                    autoFocus
                                    className="glass-input w-full text-2xl font-bold"
                                    placeholder="0"
                                    value={transactionAmount}
                                    onChange={e => setTransactionAmount(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs uppercase text-muted font-bold tracking-wider">Wallet</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button
                                        onClick={() => setTransactionSource('Online')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${transactionSource === 'Online' ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-white/5 border-transparent text-muted hover:bg-white/10'}`}
                                    >
                                        <span className="text-sm font-bold">Online</span>
                                    </button>
                                    <button
                                        onClick={() => setTransactionSource('Cash')}
                                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${transactionSource === 'Cash' ? 'bg-emerald-500/20 border-emerald-500 text-white' : 'bg-white/5 border-transparent text-muted hover:bg-white/10'}`}
                                    >
                                        <span className="text-sm font-bold">Cash</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setActiveJar(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10">Cancel</button>
                                <button
                                    onClick={handleTransactionSubmit}
                                    className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg ${transactionType === 'add' ? 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20' : 'bg-rose-500 hover:bg-rose-400 shadow-rose-500/20'}`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavingsJars;
