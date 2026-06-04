import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { 
    Plus, Trash2, ArrowRight, ArrowLeft, Check, Calculator, 
    AlertCircle, Info, Copy, RotateCcw, User, Coins, 
    Edit2, Users, CheckCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Utility helper for debt minimization
const calculateSettlement = (participants, expenses) => {
    // 1. Initialize total paid and total share for everyone
    const balances = {};
    participants.forEach(p => {
        balances[p] = 0;
    });

    expenses.forEach(exp => {
        const amount = parseFloat(exp.amount) || 0;
        
        // Handle Payers
        if (exp.payerType === 'single') {
            const payer = exp.payer;
            if (balances[payer] !== undefined) {
                balances[payer] += amount;
            }
        } else {
            // Multiple payers
            Object.entries(exp.payers || {}).forEach(([payer, paidAmount]) => {
                if (balances[payer] !== undefined) {
                    balances[payer] += parseFloat(paidAmount) || 0;
                }
            });
        }

        // Handle Split
        if (exp.splitType === 'equal') {
            const checkedParticipants = Object.entries(exp.splitWith || {})
                .filter(([_, checked]) => checked)
                .map(([name, _]) => name);
            
            if (checkedParticipants.length > 0) {
                const share = amount / checkedParticipants.length;
                checkedParticipants.forEach(name => {
                    if (balances[name] !== undefined) {
                        balances[name] -= share;
                    }
                });
            }
        } else {
            // Split by custom amounts
            Object.entries(exp.splitAmounts || {}).forEach(([name, oweAmount]) => {
                if (balances[name] !== undefined) {
                    balances[name] -= parseFloat(oweAmount) || 0;
                }
            });
        }
    });

    // Compute details for each participant before debt minimization
    const individualDetails = participants.map(name => {
        let totalPaid = 0;
        let totalShare = 0;
        expenses.forEach(exp => {
            const amount = parseFloat(exp.amount) || 0;
            if (exp.payerType === 'single') {
                if (exp.payer === name) totalPaid += amount;
            } else {
                totalPaid += parseFloat(exp.payers?.[name]) || 0;
            }

            if (exp.splitType === 'equal') {
                const checkedParticipants = Object.entries(exp.splitWith || {})
                    .filter(([_, checked]) => checked)
                    .map(([n, _]) => n);
                if (checkedParticipants.includes(name)) {
                    totalShare += amount / checkedParticipants.length;
                }
            } else {
                totalShare += parseFloat(exp.splitAmounts?.[name]) || 0;
            }
        });

        return {
            name,
            totalPaid: Math.round(totalPaid * 100) / 100,
            totalShare: Math.round(totalShare * 100) / 100,
            netBalance: Math.round((totalPaid - totalShare) * 100) / 100
        };
    });

    // 2. Minimize debts
    const debtors = [];
    const creditors = [];

    Object.entries(balances).forEach(([name, bal]) => {
        const rounded = Math.round(bal * 100) / 100;
        if (rounded < -0.01) {
            debtors.push({ name, amount: -rounded });
        } else if (rounded > 0.01) {
            creditors.push({ name, amount: rounded });
        }
    });

    const transactions = [];

    // Greedily match biggest debtor with biggest creditor
    while (debtors.length > 0 && creditors.length > 0) {
        debtors.sort((a, b) => b.amount - a.amount);
        creditors.sort((a, b) => b.amount - a.amount);

        const debtor = debtors[0];
        const creditor = creditors[0];

        const settledAmount = Math.min(debtor.amount, creditor.amount);
        transactions.push({
            from: debtor.name,
            to: creditor.name,
            amount: Math.round(settledAmount * 100) / 100
        });

        debtor.amount -= settledAmount;
        creditor.amount -= settledAmount;

        if (debtor.amount < 0.01) debtors.shift();
        if (creditor.amount < 0.01) creditors.shift();
    }

    return {
        individualDetails,
        transactions
    };
};

// Initial template creator for empty expenses
const createNewExpenseTemplate = (currentParticipants) => {
    const defaultPayer = currentParticipants.includes('You') ? 'You' : currentParticipants[0] || '';
    
    const defaultSplitWith = {};
    currentParticipants.forEach(p => {
        defaultSplitWith[p] = true;
    });

    const defaultPayers = {};
    currentParticipants.forEach(p => {
        defaultPayers[p] = '';
    });

    const defaultSplitAmounts = {};
    currentParticipants.forEach(p => {
        defaultSplitAmounts[p] = '';
    });

    return {
        description: '',
        amount: '',
        payerType: 'single',
        payer: defaultPayer,
        payers: defaultPayers,
        splitType: 'equal',
        splitWith: defaultSplitWith,
        splitAmounts: defaultSplitAmounts
    };
};

const SplitBill = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Group participants
    const [participants, setParticipants] = useState(['You', '']);
    
    // Ledger of expenses
    const [expenses, setExpenses] = useState([]);
    
    // Active expense edit states
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [copied, setCopied] = useState(false);

    // Helpers to manage participants
    const handleAddParticipant = () => {
        setParticipants([...participants, '']);
    };

    const handleRemoveParticipant = (index) => {
        if (participants[index] === 'You') return; // Cannot remove host
        setParticipants(participants.filter((_, i) => i !== index));
    };

    const handleUpdateParticipant = (index, value) => {
        const updated = [...participants];
        updated[index] = value;
        setParticipants(updated);
    };

    // Clean list of unique valid participants (ignoring empty fields)
    const validParticipants = useMemo(() => {
        const seen = new Set();
        return participants
            .map(p => p.trim())
            .filter(p => {
                if (p === '') return false;
                if (seen.has(p.toLowerCase())) return false;
                seen.add(p.toLowerCase());
                return true;
            });
    }, [participants]);

    // Validation for proceeding to Step 2
    const canProceedToExpenses = useMemo(() => {
        // Needs at least "You" and 1 friend, and no empty/duplicate active fields
        const trimmed = participants.map(p => p.trim());
        const emptyFields = trimmed.some(p => p === '');
        const uniqueSize = new Set(trimmed.map(p => p.toLowerCase())).size;
        return trimmed.length >= 2 && !emptyFields && uniqueSize === trimmed.length;
    }, [participants]);

    // Total expense amount in the group
    const totalGroupExpense = useMemo(() => {
        return expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    }, [expenses]);

    // Open form to add new expense
    const handleOpenAddExpense = () => {
        setEditingExpense(createNewExpenseTemplate(validParticipants));
        setShowExpenseForm(true);
    };

    // Open form to edit existing expense
    const handleOpenEditExpense = (expense) => {
        // Normalize split amounts/payers to ensure they have keys for all current participants
        const payers = { ...expense.payers };
        const splitWith = { ...expense.splitWith };
        const splitAmounts = { ...expense.splitAmounts };

        validParticipants.forEach(p => {
            if (payers[p] === undefined) payers[p] = '';
            if (splitWith[p] === undefined) splitWith[p] = true;
            if (splitAmounts[p] === undefined) splitAmounts[p] = '';
        });

        setEditingExpense({
            ...expense,
            payers,
            splitWith,
            splitAmounts
        });
        setShowExpenseForm(true);
    };

    const handleDeleteExpense = (id) => {
        setExpenses(expenses.filter(e => e.id !== id));
    };

    // Save expense and close form
    const handleSaveExpense = () => {
        if (!editingExpense) return;
        const finalExpense = {
            ...editingExpense,
            amount: parseFloat(editingExpense.amount) || 0,
        };

        if (finalExpense.id) {
            setExpenses(expenses.map(e => e.id === finalExpense.id ? finalExpense : e));
        } else {
            setExpenses([...expenses, { ...finalExpense, id: Date.now().toString() }]);
        }
        setEditingExpense(null);
        setShowExpenseForm(false);
    };

    // Validate active editing expense form
    const isExpenseFormValid = useMemo(() => {
        if (!editingExpense) return false;
        const { description, amount, payerType, payer, payers, splitType, splitWith, splitAmounts } = editingExpense;
        
        const numAmount = parseFloat(amount);
        if (!description.trim() || isNaN(numAmount) || numAmount <= 0) return false;

        // Payer validations
        if (payerType === 'single') {
            if (!payer) return false;
        } else {
            const sumPaid = Object.entries(payers)
                .filter(([p]) => validParticipants.includes(p))
                .reduce((sum, [_, val]) => sum + (parseFloat(val) || 0), 0);
            if (Math.abs(sumPaid - numAmount) > 0.01) return false;
        }

        // Split validations
        if (splitType === 'equal') {
            const checkedCount = Object.entries(splitWith)
                .filter(([p, checked]) => validParticipants.includes(p) && checked)
                .length;
            if (checkedCount === 0) return false;
        } else {
            const sumOwed = Object.entries(splitAmounts)
                .filter(([p]) => validParticipants.includes(p))
                .reduce((sum, [_, val]) => sum + (parseFloat(val) || 0), 0);
            if (Math.abs(sumOwed - numAmount) > 0.01) return false;
        }

        return true;
    }, [editingExpense, validParticipants]);

    // Calculate settlements using helper
    const settlementData = useMemo(() => {
        if (expenses.length === 0) return { individualDetails: [], transactions: [] };
        return calculateSettlement(validParticipants, expenses);
    }, [validParticipants, expenses]);

    // Filter transactions that involve the current user "You" to save to the database
    const userInvolvedDebts = useMemo(() => {
        return settlementData.transactions
            .filter(t => t.from === 'You' || t.to === 'You')
            .map(t => {
                if (t.from === 'You') {
                    // You owe someone
                    return {
                        person: t.to,
                        amount: t.amount,
                        type: 'owed_to',
                        status: 'pending'
                    };
                } else {
                    // Someone owes you
                    return {
                        person: t.from,
                        amount: t.amount,
                        type: 'owed_by',
                        status: 'pending'
                    };
                }
            });
    }, [settlementData.transactions]);

    // Share text block formatting
    const shareText = useMemo(() => {
        let text = `💸 Expense Split Summary 💸\n\n`;
        text += `Group Members: ${validParticipants.join(', ')}\n`;
        text += `Total Expenses: ₹${totalGroupExpense.toLocaleString('en-IN')}\n\n`;
        
        text += `Individual Balances:\n`;
        settlementData.individualDetails.forEach(p => {
            const bal = p.netBalance;
            const balStr = bal > 0 ? `gets back ₹${bal}` : bal < 0 ? `owes ₹${Math.abs(bal)}` : `settled`;
            text += `- ${p.name}: ${balStr} (Paid: ₹${p.totalPaid}, Share: ₹${p.totalShare})\n`;
        });
        
        text += `\nSuggested Settlements:\n`;
        if (settlementData.transactions.length === 0) {
            text += `No payments needed. Everyone is settled up! 🎉\n`;
        } else {
            settlementData.transactions.forEach(t => {
                text += `- ${t.from} pays ${t.to} ₹${t.amount.toLocaleString('en-IN')}\n`;
            });
        }
        return text;
    }, [validParticipants, totalGroupExpense, settlementData]);

    const handleCopySummary = () => {
        navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Save user involved debts to database
    const handleSaveDebts = async () => {
        if (userInvolvedDebts.length === 0) {
            navigate('/debts');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/debts/batch', { debts: userInvolvedDebts });
            setSuccess(true);
            setTimeout(() => navigate('/debts'), 2000);
        } catch (err) {
            alert('Failed to save splits to the database. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetAll = () => {
        if (window.confirm("Are you sure you want to clear the group and start over?")) {
            setStep(1);
            setParticipants(['You', '']);
            setExpenses([]);
            setShowExpenseForm(false);
            setEditingExpense(null);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            
            {/* Header section */}
            <div className="pt-2 pb-1 border-b border-border text-center relative">
                <div className="data-label mb-1">Smart Shared Expenses</div>
                <h1 className="page-title">Split Bill Ledger</h1>
                {expenses.length > 0 && (
                    <button onClick={handleResetAll} className="absolute right-0 bottom-2.5 btn-ghost text-xs py-1 px-2.5 flex items-center gap-1">
                        <RotateCcw size={11} /> Reset
                    </button>
                )}
            </div>

            {/* Premium Step indicators */}
            <div className="flex items-center justify-between px-6 max-w-md mx-auto">
                {[
                    { s: 1, label: 'Friends' },
                    { s: 2, label: 'Ledger' },
                    { s: 3, label: 'Split' },
                    { s: 4, label: 'Save' }
                ].map((item) => (
                    <div key={item.s} className="flex flex-col items-center gap-1.5 flex-1 relative">
                        {item.s > 1 && (
                            <div className="absolute right-[50%] top-4 h-[2px] w-full -translate-y-[50%] z-0"
                                 style={{ background: step >= item.s ? '#0C0C0E' : '#E5E7EB' }} />
                        )}
                        <button 
                            onClick={() => {
                                if (item.s === 1) setStep(1);
                                else if (item.s === 2 && canProceedToExpenses) setStep(2);
                                else if (item.s === 3 && expenses.length > 0 && canProceedToExpenses) setStep(3);
                                else if (item.s === 4 && expenses.length > 0 && canProceedToExpenses) setStep(4);
                            }}
                            disabled={
                                (item.s === 2 && !canProceedToExpenses) ||
                                (item.s >= 3 && (expenses.length === 0 || !canProceedToExpenses))
                            }
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs z-10 transition-all duration-300 border ${
                                step === item.s 
                                ? 'bg-ink text-white border-ink shadow-pill scale-105' 
                                : step > item.s 
                                ? 'bg-ink/10 text-ink border-ink/20' 
                                : 'bg-surface text-dim border-border'
                            }`}
                        >
                            {step > item.s ? <Check size={12} className="stroke-[3]" /> : item.s}
                        </button>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step === item.s ? 'text-ink' : 'text-sub'}`}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Main content panels */}
            <div className="card p-6 min-h-[40vh] flex flex-col justify-between">
                
                {/* STEP 1: Add Group Members */}
                {step === 1 && (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-base font-bold text-ink">Set up Group Members</h2>
                                <p className="text-sub text-xs mt-0.5">Who is involved in splitting these bills? Enter names below.</p>
                            </div>

                            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                                {participants.map((name, i) => (
                                    <div key={i} className="flex gap-2.5 items-center">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                                            name === 'You' ? 'bg-ink text-white' : 'bg-raised text-sub border border-border'
                                        }`}>
                                            {name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div className="relative flex-1">
                                            <input 
                                                type="text" 
                                                value={name} 
                                                onChange={(e) => handleUpdateParticipant(i, e.target.value)}
                                                className={`field-input w-full ${name === 'You' ? 'bg-zinc-100 border-zinc-200 text-sub pointer-events-none' : ''}`} 
                                                placeholder={`Friend Name`}
                                                disabled={name === 'You'}
                                                autoFocus={i === participants.length - 1 && name !== 'You'}
                                            />
                                            {name === 'You' && (
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-dim bg-zinc-200/50 px-1.5 py-0.5 rounded">Host</span>
                                            )}
                                        </div>
                                        {name !== 'You' && (
                                            <button 
                                                onClick={() => handleRemoveParticipant(i)} 
                                                className="w-11 h-11 rounded-xl text-dim hover:text-neg hover:bg-neg/10 flex items-center justify-center transition-all border border-border hover:border-neg/20"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={handleAddParticipant} 
                                className="w-full py-3 border border-dashed border-border-strong rounded-xl text-sub hover:text-ink hover:border-ink/50 transition-all flex items-center justify-center gap-1.5 text-xs font-bold bg-zinc-50/50 hover:bg-zinc-50"
                            >
                                <Plus size={13} /> Add Group Member
                            </button>
                        </div>

                        <div className="pt-5 border-t border-border flex justify-end">
                            <button 
                                onClick={() => setStep(2)} 
                                disabled={!canProceedToExpenses}
                                className="btn-primary w-full sm:w-auto font-bold px-6 flex items-center justify-center gap-1.5"
                            >
                                Next: Add Expenses <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Ledger & Expense Items */}
                {step === 2 && (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                        
                        {/* Display Form inline if triggered */}
                        {showExpenseForm && editingExpense ? (
                            <div className="space-y-4 border border-border-strong rounded-2xl p-5 bg-zinc-50/50">
                                <div className="flex justify-between items-center pb-2 border-b border-border">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-ink flex items-center gap-1.5">
                                        <Coins size={14} /> {editingExpense.id ? 'Edit Expense Item' : 'Add Expense Item'}
                                    </span>
                                    <button 
                                        onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }}
                                        className="text-sub hover:text-ink text-xs font-semibold"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="data-label block mb-1.5">Description</label>
                                        <input 
                                            type="text" 
                                            value={editingExpense.description} 
                                            onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                                            className="field-input w-full font-medium" 
                                            placeholder="e.g. Pizza, Cab, Airbnb" 
                                            required 
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="data-label block mb-1.5">Total Amount (₹)</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sub font-semibold">₹</span>
                                            <input 
                                                type="number" 
                                                value={editingExpense.amount} 
                                                onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                                                className="field-input w-full pl-8 font-semibold" 
                                                placeholder="0.00" 
                                                required 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Paid By Selection */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="data-label block">Who Paid?</label>
                                        <div className="flex bg-raised rounded-lg p-0.5 border border-border">
                                            <button 
                                                type="button"
                                                onClick={() => setEditingExpense({ ...editingExpense, payerType: 'single' })}
                                                className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                                                    editingExpense.payerType === 'single' ? 'bg-white shadow-pill text-ink' : 'text-sub hover:text-ink'
                                                }`}
                                            >
                                                Single Payer
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setEditingExpense({ ...editingExpense, payerType: 'multiple' })}
                                                className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                                                    editingExpense.payerType === 'multiple' ? 'bg-white shadow-pill text-ink' : 'text-sub hover:text-ink'
                                                }`}
                                            >
                                                Multiple
                                            </button>
                                        </div>
                                    </div>

                                    {editingExpense.payerType === 'single' ? (
                                        <select 
                                            value={editingExpense.payer}
                                            onChange={(e) => setEditingExpense({ ...editingExpense, payer: e.target.value })}
                                            className="field-input w-full bg-surface"
                                        >
                                            <option value="">Select payer...</option>
                                            {validParticipants.map((p, idx) => (
                                                <option key={idx} value={p}>{p}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="border border-border rounded-xl p-3 bg-surface space-y-2 max-h-36 overflow-y-auto">
                                            {validParticipants.map((p, idx) => (
                                                <div key={idx} className="flex items-center justify-between gap-3">
                                                    <span className="text-xs text-ink font-medium">{p}</span>
                                                    <div className="relative w-32">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sub text-[10px]">₹</span>
                                                        <input 
                                                            type="number"
                                                            value={editingExpense.payers?.[p] || ''}
                                                            onChange={(e) => {
                                                                const updatedPayers = { ...editingExpense.payers, [p]: e.target.value };
                                                                setEditingExpense({ ...editingExpense, payers: updatedPayers });
                                                            }}
                                                            placeholder="0"
                                                            className="field-input py-1.5 pl-6 text-xs w-full text-right"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-2 border-t border-border flex justify-between items-center text-[10px]">
                                                <span className="text-sub font-semibold">Total Allocated:</span>
                                                <span className={`font-bold ${
                                                    Math.abs(Object.values(editingExpense.payers).reduce((sum, v) => sum + (parseFloat(v) || 0), 0) - (parseFloat(editingExpense.amount) || 0)) <= 0.01
                                                    ? 'text-pos' : 'text-neg'
                                                }`}>
                                                    ₹{Object.values(editingExpense.payers).reduce((sum, v) => sum + (parseFloat(v) || 0), 0).toLocaleString('en-IN')} / ₹{parseFloat(editingExpense.amount) || 0}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Split With Selection */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="data-label block">Split Between</label>
                                        <div className="flex bg-raised rounded-lg p-0.5 border border-border">
                                            <button 
                                                type="button"
                                                onClick={() => setEditingExpense({ ...editingExpense, splitType: 'equal' })}
                                                className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                                                    editingExpense.splitType === 'equal' ? 'bg-white shadow-pill text-ink' : 'text-sub hover:text-ink'
                                                }`}
                                            >
                                                Split Equally
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setEditingExpense({ ...editingExpense, splitType: 'custom' })}
                                                className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${
                                                    editingExpense.splitType === 'custom' ? 'bg-white shadow-pill text-ink' : 'text-sub hover:text-ink'
                                                }`}
                                            >
                                                Custom Amounts
                                            </button>
                                        </div>
                                    </div>

                                    {editingExpense.splitType === 'equal' ? (
                                        <div className="border border-border rounded-xl p-3 bg-surface space-y-2 max-h-36 overflow-y-auto">
                                            <div className="flex justify-between items-center pb-1.5 mb-1 border-b border-border">
                                                <span className="text-[10px] text-sub font-bold">Select participants:</span>
                                                <div className="flex gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const sw = {};
                                                            validParticipants.forEach(p => sw[p] = true);
                                                            setEditingExpense({ ...editingExpense, splitWith: sw });
                                                        }}
                                                        className="text-[9px] font-bold text-ink hover:underline"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const sw = {};
                                                            validParticipants.forEach(p => sw[p] = false);
                                                            setEditingExpense({ ...editingExpense, splitWith: sw });
                                                        }}
                                                        className="text-[9px] font-bold text-sub hover:underline"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {validParticipants.map((p, idx) => {
                                                    const checked = !!editingExpense.splitWith?.[p];
                                                    const checkedCount = Object.values(editingExpense.splitWith).filter(Boolean).length;
                                                    const personShare = checkedCount > 0 ? (parseFloat(editingExpense.amount) || 0) / checkedCount : 0;
                                                    return (
                                                        <label key={idx} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                                            checked ? 'bg-zinc-50 border-ink/20' : 'bg-surface border-border opacity-60'
                                                        }`}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={checked}
                                                                onChange={(e) => {
                                                                    const updatedSw = { ...editingExpense.splitWith, [p]: e.target.checked };
                                                                    setEditingExpense({ ...editingExpense, splitWith: updatedSw });
                                                                }}
                                                                className="w-3.5 h-3.5 accent-ink rounded"
                                                            />
                                                            <div className="text-left leading-tight">
                                                                <div className="text-xs text-ink font-semibold">{p}</div>
                                                                {checked && <div className="text-[9px] text-sub font-medium">₹{personShare.toFixed(2)}</div>}
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border border-border rounded-xl p-3 bg-surface space-y-2 max-h-36 overflow-y-auto">
                                            {validParticipants.map((p, idx) => (
                                                <div key={idx} className="flex items-center justify-between gap-3">
                                                    <span className="text-xs text-ink font-medium">{p}</span>
                                                    <div className="relative w-32">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sub text-[10px]">₹</span>
                                                        <input 
                                                            type="number"
                                                            value={editingExpense.splitAmounts?.[p] || ''}
                                                            onChange={(e) => {
                                                                const updatedAmounts = { ...editingExpense.splitAmounts, [p]: e.target.value };
                                                                setEditingExpense({ ...editingExpense, splitAmounts: updatedAmounts });
                                                            }}
                                                            placeholder="0"
                                                            className="field-input py-1.5 pl-6 text-xs w-full text-right"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-2 border-t border-border flex justify-between items-center text-[10px]">
                                                <span className="text-sub font-semibold">Total Allocated:</span>
                                                <span className={`font-bold ${
                                                    Math.abs(Object.values(editingExpense.splitAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0) - (parseFloat(editingExpense.amount) || 0)) <= 0.01
                                                    ? 'text-pos' : 'text-neg'
                                                }`}>
                                                    ₹{Object.values(editingExpense.splitAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0).toLocaleString('en-IN')} / ₹{parseFloat(editingExpense.amount) || 0}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={handleSaveExpense}
                                    disabled={!isExpenseFormValid}
                                    className="w-full bg-ink hover:bg-neutral-800 disabled:opacity-40 text-white font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1"
                                >
                                    <Check size={14} /> Save Expense Item
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-base font-bold text-ink">Expenses Ledger</h2>
                                        <p className="text-sub text-xs mt-0.5">Add items paid by group members.</p>
                                    </div>
                                    <button 
                                        onClick={handleOpenAddExpense}
                                        className="btn-ghost py-1.5 px-3 flex items-center gap-1 text-xs font-bold border-border-strong hover:bg-raised text-ink"
                                    >
                                        <Plus size={13} /> Add Item
                                    </button>
                                </div>

                                {/* Ledger empty state / list */}
                                {expenses.length === 0 ? (
                                    <div className="border border-dashed border-border-strong rounded-2xl p-8 text-center bg-zinc-50/20 space-y-2">
                                        <div className="w-10 h-10 rounded-full bg-raised flex items-center justify-center mx-auto text-sub">
                                            <Calculator size={18} />
                                        </div>
                                        <div className="text-xs text-ink font-semibold">No expenses added yet</div>
                                        <p className="text-[11px] text-sub max-w-[240px] mx-auto">Click "Add Item" to add shared costs like meals, transport, or rooms.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                                        <div className="card-tint bg-[#FAF5FF]/30 border-purple-100 p-4 flex justify-between items-center rounded-xl">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center"><Users size={14} /></div>
                                                <div>
                                                    <div className="text-xs text-sub font-semibold">Total Ledged Cost</div>
                                                    <div className="text-xs font-extrabold text-purple-700 uppercase tracking-wide">Across {expenses.length} item{expenses.length > 1 ? 's' : ''}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="num text-lg text-ink font-bold">₹{totalGroupExpense.toLocaleString('en-IN')}</div>
                                                <div className="text-[10px] text-sub font-semibold">Shared between {validParticipants.length} people</div>
                                            </div>
                                        </div>

                                        {expenses.map((exp) => (
                                            <div key={exp.id} className="border border-border rounded-xl p-3.5 flex justify-between items-center group bg-surface hover:bg-zinc-50/30 transition-all">
                                                <div className="space-y-1 text-left">
                                                    <div className="text-xs font-bold text-ink">{exp.description}</div>
                                                    <div className="text-[10px] text-sub flex flex-wrap gap-x-2 gap-y-0.5">
                                                        <span>
                                                            Paid by:{' '}
                                                            <strong className="text-ink">
                                                                {exp.payerType === 'single' 
                                                                    ? exp.payer 
                                                                    : Object.entries(exp.payers)
                                                                        .filter(([_, v]) => parseFloat(v) > 0)
                                                                        .map(([p, v]) => `${p} (₹${v})`)
                                                                        .join(', ')}
                                                            </strong>
                                                        </span>
                                                        <span className="text-zinc-300">•</span>
                                                        <span>
                                                            Split:{' '}
                                                            <strong className="text-ink">
                                                                {exp.splitType === 'equal' 
                                                                    ? 'Equally' 
                                                                    : 'Unequally'}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="num text-sm text-ink font-bold">₹{parseFloat(exp.amount).toLocaleString('en-IN')}</div>
                                                    <div className="flex gap-1">
                                                        <button 
                                                            onClick={() => handleOpenEditExpense(exp)}
                                                            className="w-8 h-8 rounded-lg text-sub hover:text-ink hover:bg-raised flex items-center justify-center border border-border"
                                                        >
                                                            <Edit2 size={11} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteExpense(exp.id)}
                                                            className="w-8 h-8 rounded-lg text-dim hover:text-neg hover:bg-neg/5 flex items-center justify-center border border-border hover:border-neg/10"
                                                        >
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-4 border-t border-border flex gap-3">
                            <button 
                                onClick={() => setStep(1)} 
                                className="flex-1 py-2.5 rounded-xl border border-border text-sub hover:text-ink hover:bg-raised text-xs font-bold transition-all flex items-center justify-center gap-1"
                            >
                                <ArrowLeft size={13} /> Back to Group
                            </button>
                            <button 
                                onClick={() => setStep(3)} 
                                disabled={expenses.length === 0 || showExpenseForm}
                                className="flex-[2] btn-primary font-bold text-xs flex items-center justify-center gap-1.5"
                            >
                                <Calculator size={14} /> Calculate & Settle up
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3: Settlements and Suggested Payments */}
                {step === 3 && (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-base font-bold text-ink">Settlement Summary</h2>
                                <p className="text-sub text-xs mt-0.5">Optimized debt minimization calculations for the group.</p>
                            </div>

                            {/* Net balances list */}
                            <div className="space-y-2 border border-border rounded-xl p-3.5 bg-zinc-50/20">
                                <div className="text-[10px] text-sub font-bold uppercase tracking-wider mb-2 border-b border-border pb-1">Group Balances</div>
                                {settlementData.individualDetails.map((p, idx) => {
                                    const bal = p.netBalance;
                                    const tintBg = bal > 0 ? '#F0FDF4' : bal < 0 ? '#FEF2F2' : 'transparent';
                                    const textColor = bal > 0 ? '#16A34A' : bal < 0 ? '#DC2626' : '#6B7280';
                                    return (
                                        <div key={idx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg border border-transparent" style={{ background: tintBg }}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-md bg-white border border-border flex items-center justify-center text-[10px] font-bold text-ink shadow-pill">
                                                    {p.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-semibold text-ink">{p.name}</span>
                                                <span className="text-[10px] text-sub">(Paid: ₹{p.totalPaid} • Share: ₹{p.totalShare})</span>
                                            </div>
                                            <span className="font-bold text-right" style={{ color: textColor }}>
                                                {bal > 0 ? `+₹${bal.toLocaleString('en-IN')}` : bal < 0 ? `-₹${Math.abs(bal).toLocaleString('en-IN')}` : '₹0 (Settled)'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Optimized Payments Path */}
                            <div className="space-y-2">
                                <div className="text-[10px] text-sub font-bold uppercase tracking-wider mb-2">Suggested Payments to Settle Up</div>
                                {settlementData.transactions.length === 0 ? (
                                    <div className="text-xs text-center py-4 border border-dashed border-border rounded-xl text-sub font-semibold bg-zinc-50/30">
                                        Everyone is settled! No payments are required. 🎉
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                                        {settlementData.transactions.map((t, idx) => {
                                            const involvesUser = t.from === 'You' || t.to === 'You';
                                            return (
                                                <div key={idx} className={`border rounded-xl p-3 flex items-center justify-between transition-all ${
                                                    involvesUser 
                                                    ? 'bg-zinc-50/80 border-ink shadow-pill' 
                                                    : 'bg-surface border-border opacity-70'
                                                }`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-xl bg-ink/5 border border-border flex items-center justify-center text-ink text-xs"><Coins size={14} /></div>
                                                        <div className="text-left text-xs font-semibold">
                                                            <span className="text-ink">{t.from}</span>
                                                            <span className="text-sub font-medium"> pays </span>
                                                            <span className="text-ink">{t.to}</span>
                                                            {involvesUser && (
                                                                <span className="ml-2 bg-ink text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide">You</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className="num text-xs font-extrabold text-ink">₹{t.amount.toLocaleString('en-IN')}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Export / Share text panel */}
                            <div className="border border-border rounded-xl p-3 bg-zinc-50 space-y-2 text-left">
                                <div className="flex justify-between items-center pb-1 border-b border-border">
                                    <span className="text-[9px] font-extrabold text-sub uppercase tracking-wider flex items-center gap-1">
                                        <Info size={11} /> Share Splits
                                    </span>
                                    <button 
                                        onClick={handleCopySummary}
                                        className="text-[9px] font-bold text-ink hover:underline flex items-center gap-1 bg-white border border-border rounded px-1.5 py-0.5"
                                    >
                                        {copied ? <Check size={9} className="stroke-[3]" /> : <Copy size={9} />} {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                                <pre className="text-[10px] text-sub font-mono whitespace-pre-wrap max-h-24 overflow-y-auto leading-relaxed">
                                    {shareText}
                                </pre>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex gap-3">
                            <button 
                                onClick={() => setStep(2)} 
                                className="flex-1 py-2.5 rounded-xl border border-border text-sub hover:text-ink hover:bg-raised text-xs font-bold transition-all flex items-center justify-center gap-1"
                            >
                                <ArrowLeft size={13} /> Back to Ledger
                            </button>
                            <button 
                                onClick={() => setStep(4)} 
                                className="flex-[2] btn-primary font-bold text-xs flex items-center justify-center gap-1.5"
                            >
                                Save Settlements <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: Confirm and Sync with DB */}
                {step === 4 && (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-base font-bold text-ink">Save to Debt Tracker</h2>
                                <p className="text-sub text-xs mt-0.5">Sync these settlement balances with your IOUs & Debts record.</p>
                            </div>

                            <div className="border border-border rounded-2xl p-4 bg-zinc-50/20 text-left space-y-3">
                                <div className="text-[10px] font-bold text-sub uppercase tracking-wider border-b border-border pb-1.5">
                                    Records to be Saved ({userInvolvedDebts.length})
                                </div>

                                {userInvolvedDebts.length === 0 ? (
                                    <div className="space-y-2 py-2">
                                        <div className="text-xs text-ink font-semibold flex items-center gap-1.5">
                                            <AlertCircle size={14} className="text-warn" /> No direct transactions for you
                                        </div>
                                        <p className="text-[11px] text-sub">
                                            None of the optimized transactions directly involve "You". You don't need to add anything to your personal debt log. You can share the summary details with your friends!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {userInvolvedDebts.map((d, idx) => {
                                            const tintBg = d.type === 'owed_by' ? '#F0FDF4' : '#FEF2F2';
                                            const textColor = d.type === 'owed_by' ? '#16A34A' : '#DC2626';
                                            return (
                                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-border bg-surface shadow-pill">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold"
                                                             style={{ background: tintBg, color: textColor }}>
                                                            {d.person.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="text-xs leading-tight">
                                                            <div className="text-ink font-bold">{d.person}</div>
                                                            <div className="text-[10px] text-sub font-semibold">
                                                                {d.type === 'owed_by' ? 'Owes you money' : 'You owe them money'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-extrabold" style={{ color: textColor }}>
                                                        {d.type === 'owed_by' ? '+' : '-'}₹{d.amount.toLocaleString('en-IN')}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        <div className="text-[10px] text-sub leading-normal bg-zinc-50 border border-border rounded-lg p-2.5 flex items-start gap-2">
                                            <Info size={13} className="text-sub shrink-0 mt-0.5" />
                                            <span>
                                                These transactions will be saved under your <strong>IOUs & Debts</strong> page with status <strong>Pending</strong>. You can mark them as settled there once paid.
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {success && (
                                <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-xl bg-pos/[0.08] border border-pos/20 text-pos text-xs font-bold animate-in">
                                    <CheckCircle size={16} /> Saved splits successfully! Redirecting to Debts…
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-border flex gap-3">
                            <button 
                                onClick={() => setStep(3)} 
                                disabled={loading || success}
                                className="flex-1 py-2.5 rounded-xl border border-border text-sub hover:text-ink hover:bg-raised text-xs font-bold transition-all flex items-center justify-center gap-1"
                            >
                                <ArrowLeft size={13} /> Back to Settlement
                            </button>
                            <button 
                                onClick={handleSaveDebts} 
                                disabled={loading || success}
                                className="flex-[2] btn-primary font-bold text-xs flex items-center justify-center gap-1.5"
                            >
                                {loading ? 'Saving…' : userInvolvedDebts.length === 0 ? 'Go to Debts' : 'Confirm & Save to Tracker'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SplitBill;
