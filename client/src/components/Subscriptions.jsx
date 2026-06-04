import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Trash2, Plus, Zap, X } from 'lucide-react';

const Subscriptions = () => {
    const [subs, setSubs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', amount: '', billingDate: 1, type: 'expense' });

    useEffect(() => { fetchSubs(); }, []);
    const fetchSubs = async () => { try { const r = await axios.get('/api/recurring'); setSubs(r.data); } catch (e) { console.error(e); } };
    const addSub = async (e) => {
        e.preventDefault();
        try { await axios.post('/api/recurring', form); fetchSubs(); setShowForm(false); setForm({ name: '', amount: '', billingDate: 1, type: 'expense' }); }
        catch { alert('Error adding'); }
    };
    const deleteSub = async (id) => {
        if (!window.confirm('Remove?')) return;
        try { await axios.delete(`/api/recurring/${id}`); fetchSubs(); } catch { alert('Error'); }
    };

    const totalMonthly = subs.reduce((s, sub) => s + sub.amount, 0);

    const TINTS = ['#EFF6FF', '#FAF5FF', '#F0FDF4', '#FFFBEB', '#FEF2F2', '#F0F9FF'];
    const ICON_BG = ['bg-blue-100', 'bg-purple-100', 'bg-green-100', 'bg-amber-100', 'bg-red-100', 'bg-cyan-100'];
    const ICON_COLOR = ['text-blue-600', 'text-purple-600', 'text-green-600', 'text-amber-600', 'text-red-500', 'text-cyan-600'];

    return (
        <div className="space-y-5 animate-fade-in-up">
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="page-title">Subscriptions</h1>
                    <p className="text-sub text-sm mt-1">Track recurring monthly bills.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-ink hover:bg-ink/85 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-card">
                    <Plus size={14} /> Add New
                </button>
            </div>

            {subs.length > 0 && (
                <div className="card p-4 flex items-center justify-between" style={{ background: '#FEF2F2' }}>
                    <div className="label">Total Monthly Spend</div>
                    <div className="num text-xl text-neg">₹{totalMonthly.toLocaleString('en-IN')}</div>
                </div>
            )}

            {showForm && (
                <div className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="label">New Subscription</div>
                        <button onClick={() => setShowForm(false)} className="w-6 h-6 rounded-lg bg-raised text-dim hover:text-ink flex items-center justify-center"><X size={12} /></button>
                    </div>
                    <form onSubmit={addSub}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <input placeholder="Name (e.g. Netflix)" className="field-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sub text-sm">₹</span>
                                <input type="number" placeholder="Monthly amount" className="field-input pl-8 w-full" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                            </div>
                            <div className="relative">
                                <Calendar size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-sub" />
                                <input type="number" min="1" max="31" placeholder="Billing day" className="field-input pl-9 w-full" value={form.billingDate} onChange={e => setForm({ ...form, billingDate: e.target.value })} required />
                            </div>
                            <button type="submit" className="bg-ink hover:bg-ink/85 text-white font-semibold py-3 rounded-xl transition-all text-sm">Save</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subs.map((sub, i) => {
                    const tint = TINTS[i % TINTS.length];
                    const ib = ICON_BG[i % ICON_BG.length];
                    const ic = ICON_COLOR[i % ICON_COLOR.length];
                    return (
                        <div key={sub._id} className="card p-5 group" style={{ background: tint }}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`icon-box ${ib} ${ic}`}><Zap size={16} /></div>
                                    <div>
                                        <div className="text-ink font-semibold text-sm">{sub.name}</div>
                                        <div className="text-sub text-xs flex items-center gap-1 mt-0.5">
                                            <Calendar size={9} /> Day {sub.billingDate} monthly
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => deleteSub(sub._id)}
                                    className="w-7 h-7 rounded-xl bg-white/80 text-dim hover:text-neg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <div className="mt-4 num text-2xl text-ink">₹{sub.amount.toLocaleString('en-IN')}<span className="text-sub text-xs font-sans font-normal ml-1">/ month</span></div>
                        </div>
                    );
                })}
                {subs.length === 0 && (
                    <div className="col-span-full card p-10 text-center">
                        <div className="text-sub text-sm mb-3">No subscriptions tracked yet.</div>
                        <button onClick={() => setShowForm(true)} className="text-ink text-sm font-semibold hover:underline underline-offset-2">Add your first one →</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Subscriptions;
