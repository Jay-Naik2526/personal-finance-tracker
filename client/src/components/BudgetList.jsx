import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, X } from 'lucide-react';

const BUDGET_CATS = ['Food/Canteen', 'Subscriptions', 'Social', 'Academics', 'Transport', 'Grocery', 'Shopping', 'Bills', 'Other'];

const BudgetList = () => {
    const [budgets, setBudgets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [current, setCurrent] = useState({ category: '', limit: '' });

    useEffect(() => { fetchBudgets(); }, []);

    const fetchBudgets = async () => {
        try { const r = await axios.get('/api/budgets'); setBudgets(r.data); }
        catch (err) { console.error(err); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/budgets', { category: current.category, limit: Number(current.limit) });
            fetchBudgets(); setIsModalOpen(false); setCurrent({ category: '', limit: '' });
        } catch { alert('Failed to save budget'); }
    };

    const openEdit = (b) => { setCurrent({ category: b.category, limit: b.limit }); setIsModalOpen(true); };

    return (
        <div className="space-y-5 animate-fade-in-up">

            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="page-title">Budgets</h1>
                    <p className="text-sub text-sm mt-1">Set monthly limits per category.</p>
                </div>
                <button onClick={() => { setCurrent({ category: '', limit: '' }); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-ink hover:bg-ink/85 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-card">
                    <Plus size={14} /> New Limit
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgets.map((budget) => {
                    const pct = Math.min((budget.spent / budget.limit) * 100, 100);
                    const isOver = budget.spent > budget.limit;
                    const barColor = isOver ? '#DC2626' : pct > 75 ? '#D97706' : '#16A34A';
                    const tintBg   = isOver ? '#FEF2F2' : pct > 75 ? '#FFFBEB' : '#F0FDF4';

                    return (
                        <div key={budget._id} className="card p-5 group relative" style={{ background: tintBg }}>
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="label mb-0.5">{budget.category}</div>
                                    <div className="text-sub text-xs">
                                        Limit: <span className="text-ink font-semibold">₹{budget.limit.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                                <button onClick={() => openEdit(budget)}
                                    className="w-7 h-7 rounded-xl bg-white/80 text-dim hover:text-ink flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                                    <Edit2 size={12} />
                                </button>
                            </div>

                            <div className="num text-2xl text-ink mb-3" style={{ color: isOver ? '#DC2626' : '#0C0C0E' }}>
                                ₹{budget.spent.toLocaleString('en-IN')}
                            </div>

                            <div className="progress-track mb-1.5">
                                <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sub text-[11px]">
                                    {isOver ? 'Over budget' : `₹${(budget.limit - budget.spent).toLocaleString('en-IN')} left`}
                                </span>
                                <span className="text-[11px] font-semibold" style={{ color: barColor }}>{pct.toFixed(0)}%</span>
                            </div>
                        </div>
                    );
                })}

                {budgets.length === 0 && (
                    <div className="col-span-full card p-10 text-center">
                        <div className="text-sub text-sm mb-3">No budgets set yet.</div>
                        <button onClick={() => setIsModalOpen(true)} className="text-ink text-sm font-semibold hover:underline underline-offset-2">
                            Create your first budget →
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="bg-surface rounded-t-3xl md:rounded-2xl w-full md:max-w-sm p-6 shadow-float animate-slide-up md:animate-in border border-border">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-ink font-bold text-base">Set Budget Limit</h3>
                            <button onClick={() => setIsModalOpen(false)} className="w-7 h-7 rounded-xl bg-raised text-dim hover:text-ink flex items-center justify-center">
                                <X size={13} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="label block mb-2">Category</label>
                                <select value={current.category} onChange={(e) => setCurrent({ ...current, category: e.target.value })}
                                    className="field-input w-full appearance-none" required>
                                    <option value="" disabled className="bg-surface">Select category…</option>
                                    {BUDGET_CATS.map(c => <option key={c} className="bg-surface">{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="label block mb-2">Monthly Limit (₹)</label>
                                <input type="number" value={current.limit} onChange={(e) => setCurrent({ ...current, limit: e.target.value })}
                                    className="field-input w-full" placeholder="e.g. 5000" required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl bg-raised hover:bg-border text-ink text-sm font-medium transition-all">
                                    Cancel
                                </button>
                                <button type="submit"
                                    className="flex-1 py-2.5 rounded-xl bg-ink hover:bg-ink/85 text-white text-sm font-semibold transition-all">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BudgetList;
