import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, ArrowRight, CheckCircle, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SplitBill = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [billDetails, setBillDetails] = useState({ amount: '', description: '' });
    const [people, setPeople] = useState([{ name: '', amount: 0 }]);

    const addPerson = () => setPeople([...people, { name: '', amount: 0 }]);
    const removePerson = (i) => setPeople(people.filter((_, idx) => idx !== i));
    const updateName = (i, name) => { const p = [...people]; p[i].name = name; setPeople(p); };

    const calculateSplit = () => {
        const split = (parseFloat(billDetails.amount) / (people.length + 1)).toFixed(2);
        setPeople(people.map(p => ({ ...p, amount: split })));
        return split;
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await axios.post('/api/debts/batch', { debts: people.map(p => ({ person: p.name, amount: p.amount, type: 'owed_by', status: 'pending' })) });
            setSuccess(true);
            setTimeout(() => navigate('/debts'), 2000);
        } catch { alert('Failed to save split.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="max-w-xl mx-auto space-y-5 animate-fade-in-up">

            <div className="pt-2 pb-1 border-b border-rule text-center">
                <div className="data-label mb-1">Shared Expenses</div>
                <h1 className="page-title">Split Bill</h1>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map(s => (
                    <div key={s} className="h-1 w-14 rounded-full transition-all duration-300"
                        style={{ background: step >= s ? '#0F0F0F' : '#DDD8CF' }} />
                ))}
            </div>

            <div className="panel p-6">
                {/* Step 1 */}
                {step === 1 && (
                    <form onSubmit={(e) => { e.preventDefault(); if (billDetails.amount && billDetails.description) setStep(2); }} className="space-y-4">
                        <div className="data-label mb-3">Bill Details</div>
                        <div>
                            <label className="data-label block mb-2">Total Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sub font-sans">₹</span>
                                <input type="number" value={billDetails.amount} onChange={(e) => setBillDetails({ ...billDetails, amount: e.target.value })}
                                    className="field-input w-full pl-8 num text-2xl" placeholder="0" required autoFocus />
                            </div>
                        </div>
                        <div>
                            <label className="data-label block mb-2">What for?</label>
                            <input type="text" value={billDetails.description} onChange={(e) => setBillDetails({ ...billDetails, description: e.target.value })}
                                className="field-input w-full" placeholder="e.g. Weekend dinner" required />
                        </div>
                        <button type="submit" className="w-full bg-ink hover:bg-neutral-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                            Next <ArrowRight size={15} />
                        </button>
                    </form>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="data-label">Add People</div>
                            <button onClick={addPerson} className="flex items-center gap-1.5 text-ink text-xs font-semibold hover:underline underline-offset-2">
                                <Plus size={12} /> Add person
                            </button>
                        </div>
                        <div className="space-y-2 max-h-[45vh] overflow-y-auto">
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-parchment border border-rule opacity-50">
                                <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center text-white text-[10px] font-bold">You</div>
                                <span className="text-sub text-sm">Me (included in split)</span>
                            </div>
                            {people.map((p, i) => (
                                <div key={i} className="flex gap-2">
                                    <input type="text" value={p.name} onChange={(e) => updateName(i, e.target.value)}
                                        className="field-input flex-1" placeholder={`Friend ${i + 1}`}
                                        autoFocus={i === people.length - 1} />
                                    {people.length > 1 && (
                                        <button onClick={() => removePerson(i)} className="w-10 h-10 rounded-lg text-dim hover:text-neg hover:bg-neg/10 flex items-center justify-center transition-all">
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-lg border border-rule text-sub hover:text-ink hover:bg-parchment text-sm transition-all">Back</button>
                            <button
                                onClick={() => { calculateSplit(); setStep(3); }}
                                disabled={people.some(p => !p.name)}
                                className="flex-[2] bg-ink hover:bg-neutral-700 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 text-sm">
                                <Calculator size={14} /> Calculate
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="data-label">Review Split</div>
                        <div className="text-center py-3 border-y border-rule">
                            <div className="num text-3xl text-ink">₹{parseFloat(billDetails.amount).toLocaleString('en-IN')}</div>
                            <div className="text-sub text-sm mt-1">{billDetails.description}</div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-parchment border border-rule">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center text-white text-[10px] font-bold">You</div>
                                    <span className="text-sub text-sm">Your share</span>
                                </div>
                                <span className="num text-sm text-ink">₹{people[0]?.amount}</span>
                            </div>
                            {people.map((p, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg bg-sheet border border-rule">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-pos/10 flex items-center justify-center text-pos text-xs font-bold">{p.name.charAt(0).toUpperCase()}</div>
                                        <span className="text-ink text-sm">{p.name}</span>
                                    </div>
                                    <span className="chip-red">Owes ₹{p.amount}</span>
                                </div>
                            ))}
                        </div>
                        {success ? (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-pos/[0.07] border border-pos/20 text-pos text-sm">
                                <CheckCircle size={15} /> Saved! Redirecting to Debts…
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg border border-rule text-sub hover:text-ink text-sm transition-all">Edit</button>
                                <button onClick={handleSubmit} disabled={loading}
                                    className="flex-[2] bg-ink hover:bg-neutral-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-all text-sm">
                                    {loading ? 'Saving…' : 'Confirm & Save'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SplitBill;
