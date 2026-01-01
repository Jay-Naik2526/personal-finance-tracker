import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Wallet } from 'lucide-react';

const BudgetList = () => {
    const [budgets, setBudgets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentBudget, setCurrentBudget] = useState({ category: '', limit: 0 });

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            const res = await axios.get('/api/budgets');
            setBudgets(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/budgets', {
                category: currentBudget.category,
                limit: Number(currentBudget.limit)
            });
            fetchBudgets();
            setIsModalOpen(false);
            setCurrentBudget({ category: '', limit: 0 });
        } catch (err) {
            alert('Failed to save budget');
        }
    };

    const openEdit = (budget) => {
        setCurrentBudget({ category: budget.category, limit: budget.limit });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Budgets</h2>
                    <p className="text-muted">Set monthly limits to keep your spending in check.</p>
                </div>
                <button
                    onClick={() => { setCurrentBudget({ category: '', limit: 0 }); setIsModalOpen(true); }}
                    className="glass-button flex items-center gap-2"
                >
                    <Plus size={18} /> New Limit
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map((budget) => {
                    const percent = Math.min((budget.spent / budget.limit) * 100, 100);
                    const isOver = budget.spent > budget.limit;

                    return (
                        <div key={budget._id} className="glass-card p-6 relative group overflow-hidden">
                            {/* Background Progress Tint */}
                            <div className={`absolute bottom-0 left-0 h-1 w-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${percent}%` }}></div>
                            <div className={`absolute inset-0 opacity-[0.03] pointer-events-none transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-primary'}`} style={{ transform: `scaleX(${percent / 100})`, transformOrigin: 'left' }}></div>

                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <Wallet size={20} className="text-white/80" />
                                </div>
                                <button onClick={() => openEdit(budget)} className="p-2 rounded-lg text-muted hover:text-white hover:bg-white/10 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-1">{budget.category}</h3>
                            <div className="text-xs text-muted mb-4 uppercase tracking-wider font-medium">Limit: ₹{budget.limit.toLocaleString()}</div>

                            <div className="flex justify-between items-end mb-2">
                                <span className={`text-3xl font-bold tracking-tight ${isOver ? 'text-rose-400' : 'text-white'}`}>
                                    ₹{budget.spent.toLocaleString()}
                                </span>
                                <span className="text-sm font-medium text-muted/80 bg-white/5 px-2 py-1 rounded-lg">{percent.toFixed(0)}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
                    <div className="glass-card p-8 max-w-sm w-full">
                        <h3 className="text-xl font-bold mb-6">Set Budget</h3>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Category</label>
                                <select
                                    value={currentBudget.category}
                                    onChange={(e) => setCurrentBudget({ ...currentBudget, category: e.target.value })}
                                    className="glass-input w-full appearance-none"
                                    required
                                >
                                    <option value="" disabled className="bg-slate-900">Select Category</option>
                                    <option className="bg-slate-900">Food/Canteen</option>
                                    <option className="bg-slate-900">Subscriptions</option>
                                    <option className="bg-slate-900">Social</option>
                                    <option className="bg-slate-900">Academics</option>
                                    <option className="bg-slate-900">Transport</option>
                                    <option className="bg-slate-900">Grocery</option>
                                    <option className="bg-slate-900">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Limit (₹)</label>
                                <input
                                    type="number"
                                    value={currentBudget.limit}
                                    onChange={(e) => setCurrentBudget({ ...currentBudget, limit: e.target.value })}
                                    className="glass-input w-full"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors shadow-lg shadow-primary/20"
                                >
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
