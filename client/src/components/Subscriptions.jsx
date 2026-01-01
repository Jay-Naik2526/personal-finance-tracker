import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Trash2, Plus, Zap } from 'lucide-react';

const Subscriptions = () => {
    const [subs, setSubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: '', amount: '', billingDate: 1, type: 'expense'
    });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchSubs();
    }, []);

    const fetchSubs = async () => {
        try {
            const res = await axios.get('/api/recurring');
            setSubs(res.data);
            setLoading(false);
        } catch (err) { console.error(err); }
    };

    const addSub = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/recurring', form);
            fetchSubs();
            setShowForm(false);
            setForm({ name: '', amount: '', billingDate: 1, type: 'expense' });
        } catch (err) { alert('Error adding subscription'); }
    };

    const deleteSub = async (id) => {
        if (!window.confirm('Stop tracking this subscription?')) return;
        try {
            await axios.delete(`/api/recurring/${id}`);
            fetchSubs();
        } catch (err) { alert('Error deleting'); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2">Subscriptions</h2>
                    <p className="text-muted">Track your recurring monthly bills.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="glass-button px-4 py-2 flex items-center gap-2"
                >
                    <Plus size={18} /> Add New
                </button>
            </header>

            {showForm && (
                <form onSubmit={addSub} className="glass-card p-6 animate-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            placeholder="Name (e.g. Netflix)"
                            className="glass-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            required
                        />
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-white/50">₹</span>
                            <input
                                type="number"
                                placeholder="Amount"
                                className="glass-input pl-8"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-3 rounded-xl border border-white/10">
                            <Calendar size={18} className="text-muted" />
                            <span className="text-sm text-muted whitespace-nowrap">Day of Month:</span>
                            <input
                                type="number"
                                min="1" max="31"
                                className="bg-transparent w-full outline-none text-white text-center"
                                value={form.billingDate}
                                onChange={e => setForm({ ...form, billingDate: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="glass-button bg-gradient-to-r from-emerald-500 to-teal-500 border-none shadow-lg shadow-emerald-500/20">
                            Save
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subs.map(sub => (
                    <div key={sub._id} className="glass-card p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => deleteSub(sub._id)} className="text-rose-400 hover:text-rose-300">
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                                <Zap size={24} className="text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">{sub.name}</h3>
                                <div className="text-xs text-muted flex items-center gap-1">
                                    <Calendar size={10} /> Bills on day {sub.billingDate}
                                </div>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            ₹{sub.amount.toLocaleString()} <span className="text-sm font-normal text-muted">/ mo</span>
                        </div>
                    </div>
                ))}
            </div>
            {subs.length === 0 && !loading && (
                <div className="text-center text-muted py-10">No subscriptions tracked yet.</div>
            )}
        </div>
    );
};

export default Subscriptions;
