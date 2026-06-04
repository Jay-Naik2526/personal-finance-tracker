import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Check, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const DebtTracker = () => {
    const [debts, setDebts] = useState([]);
    const [form, setForm] = useState({ person: '', amount: '', type: 'owed_to' });

    useEffect(() => { fetchDebts(); }, []);
    const fetchDebts = async () => { try { const r = await axios.get('/api/debts'); setDebts(r.data); } catch (e) { console.error(e); } };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try { await axios.post('/api/debts', form); setForm({ person: '', amount: '', type: 'owed_to' }); fetchDebts(); }
        catch { alert('Error saving'); }
    };
    const settleDebt = async (id) => { try { await axios.patch(`/api/debts/${id}`, { status: 'settled' }); fetchDebts(); } catch { alert('Error'); } };
    const deleteDebt = async (id) => { try { await axios.delete(`/api/debts/${id}`); fetchDebts(); } catch { alert('Error'); } };

    const receivables = debts.filter(d => d.type === 'owed_by');
    const payables    = debts.filter(d => d.type === 'owed_to');
    const totalRec = receivables.filter(d => d.status !== 'settled').reduce((s, d) => s + d.amount, 0);
    const totalPay = payables.filter(d => d.status !== 'settled').reduce((s, d) => s + d.amount, 0);

    return (
        <div className="space-y-5 animate-fade-in-up">
            <div className="pt-2">
                <h1 className="page-title">IOUs & Debts</h1>
                <p className="text-sub text-sm mt-1">Track who owes you and who you owe.</p>
            </div>

            {debts.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="card p-4" style={{ background: '#F0FDF4' }}>
                        <div className="label mb-1.5">To Receive</div>
                        <div className="num text-xl text-green-700">₹{totalRec.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="card p-4" style={{ background: '#FEF2F2' }}>
                        <div className="label mb-1.5">To Pay</div>
                        <div className="num text-xl text-neg">₹{totalPay.toLocaleString('en-IN')}</div>
                    </div>
                </div>
            )}

            <div className="card p-5">
                <div className="label mb-4">Record New Debt</div>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input type="text" value={form.person} onChange={(e) => setForm({ ...form, person: e.target.value })} className="field-input" placeholder="Person name" required />
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sub text-sm">₹</span>
                        <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="field-input pl-8 w-full" placeholder="Amount" required />
                    </div>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="field-input appearance-none">
                        <option value="owed_to" className="bg-surface">I owe them</option>
                        <option value="owed_by" className="bg-surface">They owe me</option>
                    </select>
                    <button type="submit" className="bg-ink hover:bg-ink/85 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                        <UserPlus size={14} /> Add
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowDownLeft size={13} className="text-green-600" />
                        <span className="label text-green-700">They Owe You</span>
                    </div>
                    <div className="space-y-2">
                        {receivables.map(d => <DebtRow key={d._id} debt={d} onSettle={settleDebt} onDelete={deleteDebt} />)}
                        {receivables.length === 0 && <div className="card p-5 text-center text-sub text-sm">Nobody owes you right now.</div>}
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowUpRight size={13} className="text-neg" />
                        <span className="label text-neg">You Owe Them</span>
                    </div>
                    <div className="space-y-2">
                        {payables.map(d => <DebtRow key={d._id} debt={d} onSettle={settleDebt} onDelete={deleteDebt} />)}
                        {payables.length === 0 && <div className="card p-5 text-center text-sub text-sm">You're debt free! 🎉</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DebtRow = ({ debt, onSettle, onDelete }) => {
    const isReceivable = debt.type === 'owed_by';
    const isSettled    = debt.status === 'settled';
    const tintBg = isReceivable ? '#F0FDF4' : '#FEF2F2';
    const color  = isReceivable ? '#16A34A' : '#DC2626';

    return (
        <div className={`card px-4 py-3.5 flex items-center justify-between group ${isSettled ? 'opacity-40' : ''}`} style={{ background: tintBg }}>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 bg-white/80"
                    style={{ color }}>
                    {debt.person.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="text-ink text-sm font-semibold">{debt.person}</div>
                    <div className="text-sub text-xs flex items-center gap-1.5">
                        <span>{new Date(debt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        {isSettled && <span className="chip-green py-0 px-1.5">Settled</span>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="num text-sm font-semibold" style={{ color }}>₹{debt.amount.toLocaleString('en-IN')}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isSettled && (
                        <button onClick={() => onSettle(debt._id)}
                            className="w-7 h-7 rounded-xl bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-all">
                            <Check size={12} />
                        </button>
                    )}
                    <button onClick={() => onDelete(debt._id)}
                        className="w-7 h-7 rounded-xl bg-white/80 text-dim hover:text-neg hover:bg-red-50 flex items-center justify-center transition-all">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DebtTracker;
