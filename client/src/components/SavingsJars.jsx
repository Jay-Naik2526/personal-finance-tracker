import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, ArrowUpCircle, ArrowDownCircle, X } from 'lucide-react';

const JAR_EMOJIS = [
    { value: '💰', label: 'Money Bag' }, { value: '💻', label: 'Laptop' },
    { value: '🚗', label: 'Car' },       { value: '✈️', label: 'Travel' },
    { value: '🎸', label: 'Guitar' },    { value: '🎓', label: 'Education' },
    { value: '🏠', label: 'Home' },      { value: '📱', label: 'Phone' },
];

const SavingsJars = () => {
    const [jars, setJars] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', targetAmount: '', emoji: '💰' });
    const [activeJar, setActiveJar] = useState(null);
    const [txType, setTxType] = useState('add');
    const [txAmount, setTxAmount] = useState('');
    const [txSource, setTxSource] = useState('Online');

    useEffect(() => { fetchJars(); }, []);

    const fetchJars = async () => { try { const r = await axios.get('/api/savings'); setJars(r.data); } catch (e) { console.error(e); } };
    const createJar = async (e) => {
        e.preventDefault();
        try { await axios.post('/api/savings', form); fetchJars(); setShowForm(false); setForm({ name: '', targetAmount: '', emoji: '💰' }); }
        catch { alert('Error creating goal'); }
    };
    const openTxModal = (jar, type) => { setActiveJar(jar); setTxType(type); setTxAmount(''); setTxSource('Online'); };
    const handleTxSubmit = async () => {
        if (!txAmount || Number(txAmount) <= 0) return;
        try { await axios.patch(`/api/savings/${activeJar._id}/add`, { amount: txType === 'add' ? Number(txAmount) : -Number(txAmount), source: txSource }); fetchJars(); setActiveJar(null); }
        catch { alert('Transaction failed'); }
    };
    const deleteJar = async (id) => {
        if (!window.confirm('Delete this goal?')) return;
        try { await axios.delete(`/api/savings/${id}`); fetchJars(); } catch { alert('Error'); }
    };

    return (
        <div className="space-y-5 animate-fade-in-up">
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="page-title">Savings</h1>
                    <p className="text-sub text-sm mt-1">Save toward what matters most.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-ink hover:bg-ink/85 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-card">
                    <Plus size={14} /> New Goal
                </button>
            </div>

            {showForm && (
                <div className="card p-5">
                    <div className="label mb-4">New Savings Goal</div>
                    <form onSubmit={createJar}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input placeholder="Goal name" className="field-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sub text-sm">₹</span>
                                <input type="number" placeholder="Target amount" className="field-input pl-8 w-full" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} required />
                            </div>
                            <select className="field-input appearance-none" value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })}>
                                {JAR_EMOJIS.map(e => <option key={e.value} value={e.value} className="bg-surface">{e.value} {e.label}</option>)}
                            </select>
                            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm">Create Goal</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {jars.map(jar => {
                    const pct = Math.min(100, Math.round((jar.currentAmount / jar.targetAmount) * 100));
                    const remaining = jar.targetAmount - jar.currentAmount;
                    return (
                        <div key={jar._id} className="card p-5 group" style={{ background: pct >= 100 ? '#F0FDF4' : '#FAFAFA' }}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-white border border-border flex items-center justify-center text-2xl flex-shrink-0 shadow-card">{jar.emoji}</div>
                                    <div>
                                        <div className="text-ink font-semibold text-sm">{jar.name}</div>
                                        <div className="text-sub text-xs mt-0.5">Target: <span className="text-ink font-semibold">₹{jar.targetAmount.toLocaleString('en-IN')}</span></div>
                                    </div>
                                </div>
                                <button onClick={() => deleteJar(jar._id)}
                                    className="w-7 h-7 rounded-xl bg-white/80 text-dim hover:text-neg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <div className="num text-2xl text-ink mb-1">₹{jar.currentAmount.toLocaleString('en-IN')}</div>
                            <div className="text-sub text-xs mb-3">{remaining > 0 ? `₹${remaining.toLocaleString('en-IN')} to go` : 'Goal reached! 🎉'}</div>
                            <div className="progress-track mb-1.5">
                                <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#16A34A' : pct > 60 ? '#6366F1' : '#D1D5DB' }} />
                            </div>
                            <div className="flex justify-between mb-4">
                                <span className="text-sub text-[11px]">Progress</span>
                                <span className="text-ink text-[11px] font-semibold">{pct}%</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => openTxModal(jar, 'withdraw')} className="py-2 rounded-xl bg-red-50 hover:bg-red-100 text-neg text-xs font-semibold flex items-center justify-center gap-1.5 border border-red-200/60 transition-all">
                                    <ArrowDownCircle size={12} /> Withdraw
                                </button>
                                <button onClick={() => openTxModal(jar, 'add')} className="py-2 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold flex items-center justify-center gap-1.5 border border-green-200/60 transition-all">
                                    <ArrowUpCircle size={12} /> Add
                                </button>
                            </div>
                        </div>
                    );
                })}
                {jars.length === 0 && !showForm && (
                    <div className="col-span-full card p-10 text-center">
                        <div className="text-3xl mb-3">🌱</div>
                        <div className="text-sub text-sm mb-3">Start your first savings goal.</div>
                        <button onClick={() => setShowForm(true)} className="text-ink text-sm font-semibold hover:underline underline-offset-2">Create one now →</button>
                    </div>
                )}
            </div>

            {activeJar && (
                <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="bg-surface border border-border rounded-t-3xl md:rounded-2xl w-full md:max-w-sm p-6 shadow-float animate-slide-up md:animate-in">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <div className="label mb-0.5">{activeJar.name}</div>
                                <h3 className={`font-bold text-base ${txType === 'add' ? 'text-green-700' : 'text-neg'}`}>{txType === 'add' ? 'Add Money' : 'Withdraw'}</h3>
                            </div>
                            <button onClick={() => setActiveJar(null)} className="w-7 h-7 rounded-xl bg-raised text-dim hover:text-ink flex items-center justify-center"><X size={13} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="label block mb-2">Amount (₹)</label>
                                <input type="number" autoFocus className="field-input w-full num text-2xl" placeholder="0" value={txAmount} onChange={e => setTxAmount(e.target.value)} />
                            </div>
                            <div>
                                <label className="label block mb-2">Wallet</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-raised rounded-xl">
                                    {['Online', 'Cash'].map(src => (
                                        <button key={src} onClick={() => setTxSource(src)}
                                            className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${txSource === src ? 'bg-surface text-ink shadow-card' : 'text-sub hover:text-ink'}`}>{src}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button onClick={() => setActiveJar(null)} className="flex-1 py-2.5 rounded-xl bg-raised hover:bg-border text-ink text-sm font-medium transition-all">Cancel</button>
                                <button onClick={handleTxSubmit}
                                    className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all ${txType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-neg hover:bg-red-700'}`}>
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
