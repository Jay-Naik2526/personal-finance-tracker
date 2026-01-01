import React, { useState } from 'react';
import { ArrowRight, CheckCircle, AlertCircle, Wand2, Type, FileText } from 'lucide-react';
import axios from 'axios';

const AddTransaction = () => {
    const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'parser'

    // Parser State
    const [text, setText] = useState('');
    const [parsedMessage, setParsedMessage] = useState(null);

    // Form State (Shared for both modes)
    const [form, setForm] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        merchant: '',
        category: 'Uncategorized',
        source: 'Online',
        description: '',
        type: 'expense'
    });

    const categories = form.type === 'expense'
        ? ['Food/Canteen', 'Transport', 'Shopping', 'Social', 'Academics', 'Bills', 'Other']
        : ['Allowance', 'Salary', 'Gift', 'Refund', 'Other'];

    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');



    const parseSMS = () => {
        let amount = 0;
        let merchant = 'Unknown';
        let date = new Date();
        let found = false;

        const amountRegex = /(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i;
        const amountMatch = text.match(amountRegex);
        if (amountMatch) {
            amount = parseFloat(amountMatch[1].replace(/,/g, ''));
            found = true;
        }

        const merchantRegex = /(?:at|to|Info:)\s+([A-Za-z0-9\s\.\-_]+?)(?:\s+on|[\.]|$)/i;
        const merchantMatch = text.match(merchantRegex);
        if (merchantMatch) {
            merchant = merchantMatch[1].trim();
        }

        // Date extraction logic from before
        const dateRegex = /(\d{2}[-\/]\d{2}[-\/]\d{2,4})|(\d{4}[-\/]\d{2}[-\/]\d{2})/;
        const dateMatch = text.match(dateRegex);
        if (dateMatch) {
            try {
                const dateStr = dateMatch[0];
                date = new Date(dateStr);
                if (isNaN(date.getTime())) {
                    const parts = dateStr.split(/[-\/]/);
                    if (parts.length === 3) {
                        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    }
                }
            } catch (e) {
                console.log(e);
            }
        }

        if (found) {
            setForm({
                ...form,
                amount: amount,
                merchant: merchant,
                date: date.toISOString().split('T')[0],
                source: text.toLowerCase().includes('upi') ? 'Online' : 'Cash',
                description: `Parsed: ${merchant}`
            });
            setParsedMessage({ type: 'success', text: 'Data extracted! Review below.' });
            setActiveTab('manual'); // Switch to review/manual mode
        } else {
            setParsedMessage({ type: 'error', text: 'Could not extract amount.' });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/transactions', {
                ...form,
                description: form.merchant, // standardizing
            });
            setSuccessMessage('Transaction saved successfully!');
            setForm({
                amount: '',
                date: new Date().toISOString().split('T')[0],
                merchant: '',
                category: 'Uncategorized',
                source: 'Online',
                description: ''
            });
            setText('');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            alert('Failed to save.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <header className="mb-8 text-center">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Add Transaction</h2>
                <p className="text-muted">Manually enter a purchase or auto-scan an SMS.</p>
            </header>

            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mb-6">
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'manual' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'
                        }`}
                >
                    <Type size={18} /> Manual Entry
                </button>
                <button
                    onClick={() => setActiveTab('parser')}
                    className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'parser' ? 'bg-primary text-white shadow-lg' : 'text-muted hover:text-white'
                        }`}
                >
                    <Wand2 size={18} /> Smart Parser
                </button>
            </div>

            {/* Notification */}
            {successMessage && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="mr-3" size={20} /> {successMessage}
                </div>
            )}

            {/* Parser Tab */}
            {activeTab === 'parser' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                    <div className="glass-card p-1">
                        <textarea
                            className="w-full bg-transparent p-6 text-white placeholder-white/20 outline-none resize-none min-h-[150px] font-mono text-sm"
                            placeholder="Paste SMS here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        ></textarea>
                        <div className="border-t border-white/5 p-4 flex justify-end bg-white/5 rounded-b-xl">
                            <button
                                onClick={parseSMS}
                                disabled={!text}
                                className="glass-button flex items-center gap-2"
                            >
                                <Wand2 size={16} /> Extract Data
                            </button>
                        </div>
                    </div>
                    {parsedMessage && (
                        <div className={`text-sm ${parsedMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'} px-2`}>
                            {parsedMessage.text}
                        </div>
                    )}
                </div>
            )}

            {/* Manual Form Tab (also used for review) */}
            {activeTab === 'manual' && (
                <form onSubmit={handleSave} className="glass-card p-8 animate-in fade-in slide-in-from-right-4">

                    {/* Type Toggle */}
                    <div className="flex gap-4 mb-6">
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: 'expense' })}
                            className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${form.type === 'expense' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-white/5 border-transparent text-muted'}`}
                        >
                            Expense
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: 'income' })}
                            className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all ${form.type === 'income' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-transparent text-muted'}`}
                        >
                            Income
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="md:col-span-2">
                            <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-white/50 text-lg">₹</span>
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    className="glass-input w-full pl-10 text-xl font-bold"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Merchant / Description</label>
                            <input
                                type="text"
                                value={form.merchant}
                                onChange={(e) => setForm({ ...form, merchant: e.target.value })}
                                className="glass-input w-full"
                                placeholder="e.g. Starbucks, Uber, etc."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Date</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="glass-input w-full text-white/80"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Payment Method</label>
                            <select
                                value={form.source}
                                onChange={(e) => setForm({ ...form, source: e.target.value })}
                                className="glass-input w-full appearance-none"
                            >
                                <option value="Online" className="bg-slate-900">Online / UPI</option>
                                <option value="Cash" className="bg-slate-900">Cash</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Category</label>
                            <div className="grid grid-cols-3 gap-2">
                                {categories.map(cat => (
                                    <button
                                        type="button"
                                        key={cat}
                                        onClick={() => setForm({ ...form, category: cat })}
                                        className={`py-2 rounded-lg text-sm border transition-all ${form.category === cat
                                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-white/5 border-white/5 text-muted hover:bg-white/10'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white p-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-primary/25 flex justify-center items-center group"
                    >
                        {loading ? 'Saving...' : 'Confirm Transaction'}
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </button>
                </form>
            )}
        </div>
    );
};

export default AddTransaction;
