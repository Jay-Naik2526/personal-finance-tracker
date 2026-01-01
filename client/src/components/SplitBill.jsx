import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Users, ArrowRight, CheckCircle, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SplitBill = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Details, 2: Add People, 3: Review
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [billDetails, setBillDetails] = useState({
        amount: '',
        description: '',
    });

    const [people, setPeople] = useState([
        { name: '', amount: 0 }
    ]);

    // Handle initial details
    const handleDetailsNext = (e) => {
        e.preventDefault();
        if (billDetails.amount && billDetails.description) {
            setStep(2);
        }
    };

    // Add a person
    const addPerson = () => {
        setPeople([...people, { name: '', amount: 0 }]);
    };

    // Remove a person
    const removePerson = (index) => {
        const newPeople = people.filter((_, i) => i !== index);
        setPeople(newPeople);
    };

    // Update person name
    const updatePersonName = (index, name) => {
        const newPeople = [...people];
        newPeople[index].name = name;
        setPeople(newPeople);
    };

    // Auto Split (Equal)
    const calculateSplit = () => {
        const total = parseFloat(billDetails.amount);
        const count = people.length + 1; // +1 for yourself
        const splitAmount = (total / count).toFixed(2);

        const updatedPeople = people.map(p => ({
            ...p,
            amount: splitAmount
        }));
        setPeople(updatedPeople);
        return splitAmount;
    };

    // Submit
    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Prepare payloads
            // We only create debts for OTHERS (people array), not self.
            const debts = people.map(p => ({
                person: p.name,
                amount: p.amount, // Calculated split
                type: 'owed_by', // They owe me
                status: 'pending'
            }));

            await axios.post('/api/debts/batch', { debts });

            setSuccess(true);
            setTimeout(() => navigate('/debts'), 2000);
        } catch (err) {
            alert('Failed to save split.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up pb-24">
            <header className="mb-8 text-center">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2 flex items-center justify-center gap-3">
                    <Users className="text-indigo-400" /> Split the Bill
                </h2>
                <p className="text-muted">Fairly split expenses and track who owes you.</p>
            </header>

            {/* Steps Indicator */}
            <div className="flex justify-center mb-8 gap-2">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`h-2 w-16 rounded-full transition-all ${step >= s ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10'
                        }`} />
                ))}
            </div>

            <div className="glass-card p-6 md:p-8 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>

                {/* Step 1: Bill Details */}
                {step === 1 && (
                    <form onSubmit={handleDetailsNext} className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Total Bill Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-white/50 text-lg">₹</span>
                                <input
                                    type="number"
                                    value={billDetails.amount}
                                    onChange={(e) => setBillDetails({ ...billDetails, amount: e.target.value })}
                                    className="glass-input w-full pl-10 text-xl font-bold"
                                    placeholder="0.00"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">For What?</label>
                            <input
                                type="text"
                                value={billDetails.description}
                                onChange={(e) => setBillDetails({ ...billDetails, description: e.target.value })}
                                className="glass-input w-full"
                                placeholder="e.g. Weekend Pizza Party 🍕"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full glass-button-primary py-4 flex justify-center items-center gap-2">
                            Next <ArrowRight size={18} />
                        </button>
                    </form>
                )}

                {/* Step 2: Add People */}
                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Who is splitting?</h3>
                            <button onClick={addPerson} className="text-xs glass-button flex items-center gap-1 py-1 px-3">
                                <Plus size={14} /> Add Person
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 opacity-50">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">You</div>
                                <div className="flex-1 font-medium">Me</div>
                                <div className="text-sm text-muted">Includes you</div>
                            </div>

                            {people.map((person, index) => (
                                <div key={index} className="flex gap-3 animate-in slide-in-from-bottom-2">
                                    <input
                                        type="text"
                                        value={person.name}
                                        onChange={(e) => updatePersonName(index, e.target.value)}
                                        className="glass-input flex-1"
                                        placeholder={`Friend ${index + 1} Name`}
                                        autoFocus={index === people.length - 1} // Auto focus new field
                                    />
                                    {people.length > 1 && (
                                        <button onClick={() => removePerson(index)} className="p-3 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-muted transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => { calculateSplit(); setStep(3); }}
                                className="flex-[2] glass-button-primary py-3 flex justify-center items-center gap-2"
                                disabled={people.some(p => !p.name)}
                            >
                                <Calculator size={18} /> Calculate Split
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Review & Confirm */}
                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                        <div className="text-center">
                            <div className="text-sm text-muted mb-1">Total Bill</div>
                            <div className="text-3xl font-bold text-white">₹{isNaN(parseFloat(billDetails.amount)) ? '0' : parseFloat(billDetails.amount).toLocaleString()}</div>
                            <div className="text-indigo-400 text-sm mt-1">{billDetails.description}</div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                <span className="text-muted">Split 3 ways (Example)</span>
                                <span className="font-mono"> Equal Split</span>
                            </div>

                            {/* You */}
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">You</div>
                                    <span className="text-white/70">My Share</span>
                                </span>
                                <span className="font-bold">₹{people[0]?.amount}</span>
                            </div>

                            {/* Others */}
                            {people.map((p, i) => (
                                <div key={i} className="flex justify-between items-center">
                                    <span className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-400">{p.name.charAt(0)}</div>
                                        <span>{p.name}</span>
                                    </span>
                                    <span className="font-bold text-rose-400">Owning ₹{p.amount}</span>
                                </div>
                            ))}
                        </div>

                        {success ? (
                            <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center gap-2 animate-in zoom-in">
                                <CheckCircle size={20} /> Saved! Redirecting...
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-muted transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-[2] glass-button-primary py-3 flex justify-center items-center gap-2"
                                >
                                    {loading ? 'Saving...' : 'Confirm & Send'}
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
