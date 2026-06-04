import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Wand2, Type } from 'lucide-react';
import axios from 'axios';

const EXPENSE_CATS = ['Food/Canteen', 'Transport', 'Shopping', 'Social', 'Academics', 'Bills', 'Other'];
const INCOME_CATS  = ['Allowance', 'Salary', 'Gift', 'Refund', 'Other'];

const AddTransaction = () => {
    const [activeTab, setActiveTab] = useState('manual');
    const [text, setText] = useState('');
    const [parsedMsg, setParsedMsg] = useState(null);
    const [form, setForm] = useState({
        amount: '', date: new Date().toISOString().split('T')[0],
        merchant: '', category: 'Uncategorized', source: 'Online', description: '', type: 'expense',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const categories = form.type === 'expense' ? EXPENSE_CATS : INCOME_CATS;

    const parseSMS = () => {
        let amount = 0, merchant = 'Unknown', date = new Date(), found = false;
        const am = text.match(/(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i);
        if (am) { amount = parseFloat(am[1].replace(/,/g, '')); found = true; }
        const mm = text.match(/(?:at|to|Info:)\s+([A-Za-z0-9\s.\-_]+?)(?:\s+on|[.]|$)/i);
        if (mm) merchant = mm[1].trim();
        const dm = text.match(/(\d{2}[-\/]\d{2}[-\/]\d{2,4})|(\d{4}[-\/]\d{2}[-\/]\d{2})/);
        if (dm) { try { date = new Date(dm[0]); if (isNaN(date.getTime())) { const p = dm[0].split(/[-\/]/); if (p.length === 3) date = new Date(`${p[2]}-${p[1]}-${p[0]}`); } } catch { } }
        if (found) {
            setForm({ ...form, amount, merchant, date: date.toISOString().split('T')[0], source: text.toLowerCase().includes('upi') ? 'Online' : 'Cash', description: `Parsed: ${merchant}` });
            setParsedMsg({ type: 'success', text: 'Data extracted! Review below.' });
            setActiveTab('manual');
        } else {
            setParsedMsg({ type: 'error', text: 'Could not extract amount.' });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            await axios.post('/api/transactions', { ...form, description: form.merchant });
            setSuccess('Transaction saved!');
            setForm({ amount: '', date: new Date().toISOString().split('T')[0], merchant: '', category: 'Uncategorized', source: 'Online', description: '', type: 'expense' });
            setText('');
            setTimeout(() => setSuccess(''), 3000);
        } catch { alert('Failed to save.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in-up">

            <div className="pt-2">
                <h1 className="page-title">Add Transaction</h1>
                <p className="text-sub text-sm mt-1">Record a payment or income manually, or scan an SMS.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-raised rounded-2xl">
                {[
                    { id: 'manual', label: 'Manual Entry', icon: Type },
                    { id: 'parser', label: 'SMS Parser',   icon: Wand2 },
                ].map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === id ? 'bg-surface text-ink shadow-card' : 'text-sub hover:text-ink'
                        }`}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {success && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                    <CheckCircle size={15} /> {success}
                </div>
            )}

            {/* SMS Parser */}
            {activeTab === 'parser' && (
                <div className="card overflow-hidden">
                    <textarea
                        className="w-full bg-transparent px-5 pt-5 pb-4 text-ink placeholder-dim outline-none resize-none min-h-[130px] font-mono text-sm leading-relaxed"
                        placeholder="Paste your bank SMS here…&#10;e.g. Rs.500 debited at Swiggy on 01/06/25"
                        value={text} onChange={(e) => setText(e.target.value)}
                    />
                    <div className="border-t border-border px-5 py-3.5 flex items-center justify-between bg-raised/50">
                        {parsedMsg && (
                            <span className={`text-xs font-medium ${parsedMsg.type === 'success' ? 'text-green-600' : 'text-neg'}`}>
                                {parsedMsg.text}
                            </span>
                        )}
                        <button onClick={parseSMS} disabled={!text}
                            className="ml-auto flex items-center gap-2 bg-ink hover:bg-ink/85 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all">
                            <Wand2 size={13} /> Extract
                        </button>
                    </div>
                </div>
            )}

            {/* Manual Form */}
            {activeTab === 'manual' && (
                <form onSubmit={handleSave} className="card p-5 space-y-5">

                    {/* Type toggle */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-raised rounded-xl">
                        {['expense', 'income'].map((t) => (
                            <button key={t} type="button"
                                onClick={() => setForm({ ...form, type: t, category: t === 'expense' ? EXPENSE_CATS[0] : INCOME_CATS[0] })}
                                className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                                    form.type === t
                                        ? t === 'expense'
                                            ? 'bg-red-50 text-neg shadow-card border border-red-200/70'
                                            : 'bg-green-50 text-green-700 shadow-card border border-green-200/70'
                                        : 'text-sub hover:text-ink'
                                }`}>
                                {t === 'expense' ? 'Expense' : 'Income'}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="label block mb-2">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sub">₹</span>
                            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                className="field-input w-full pl-8 num text-2xl" placeholder="0" required />
                        </div>
                    </div>

                    <div>
                        <label className="label block mb-2">Merchant / Description</label>
                        <input type="text" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })}
                            className="field-input w-full" placeholder="e.g. Swiggy, Petrol, Rent" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label block mb-2">Date</label>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="field-input w-full" required />
                        </div>
                        <div>
                            <label className="label block mb-2">Payment Method</label>
                            <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                                className="field-input w-full appearance-none">
                                <option value="Online" className="bg-surface">Online / UPI</option>
                                <option value="Cash"   className="bg-surface">Cash</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label block mb-3">Category</label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        form.category === cat
                                            ? 'bg-ink text-white'
                                            : 'bg-raised text-sub hover:text-ink hover:bg-border'
                                    }`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        className="w-full bg-ink hover:bg-ink/85 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-card-md">
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving…
                            </span>
                        ) : (<>Confirm Transaction <ArrowRight size={16} /></>)}
                    </button>
                </form>
            )}
        </div>
    );
};

export default AddTransaction;
