import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calculator, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const Wishlist = () => {
    const [balance, setBalance] = useState(0);
    const [loadingBal, setLoadingBal] = useState(true);
    const [item, setItem] = useState({ name: '', price: '' });
    const [result, setResult] = useState(null);

    useEffect(() => {
        axios.get('/api/dashboard/stats').then(r => setBalance(r.data.totalBalance)).catch(() => {}).finally(() => setLoadingBal(false));
    }, []);

    const checkAffordability = (e) => {
        e.preventDefault();
        const price = parseFloat(item.price);
        if (!price) return;

        if (balance === 0) {
            setResult({ verdict: 'No funds', color: 'neg', icon: XCircle, message: "Your balance is 0. Add income or transactions first.", remaining: -price });
            return;
        }

        const remaining = balance - price;
        const ratio = (price / balance) * 100;

        if      (remaining < 0)                                    setResult({ verdict: 'Not enough',  color: 'neg',  icon: XCircle,      message: `You're short by ₹${Math.abs(remaining).toLocaleString('en-IN')}.`,                        remaining });
        else if (remaining < 500 && remaining < balance * 0.1)    setResult({ verdict: 'Risky',        color: 'warn', icon: AlertTriangle, message: `Only ₹${remaining.toLocaleString('en-IN')} left. Very tight!`,                           remaining });
        else if (ratio > 60)                                       setResult({ verdict: 'Big spend',    color: 'ink',  icon: AlertTriangle, message: `This uses ${Math.round(ratio)}% of your balance. Affordable but significant.`,           remaining });
        else                                                       setResult({ verdict: 'Go for it',    color: 'pos',  icon: CheckCircle,   message: `You'll have ₹${remaining.toLocaleString('en-IN')} left comfortably.`,                   remaining });
    };

    const STYLES = {
        neg:  { border: 'border-neg/30',  bg: 'bg-neg/[0.06]',  text: 'text-neg' },
        warn: { border: 'border-warn/30', bg: 'bg-warn/[0.06]', text: 'text-warn' },
        ink:  { border: 'border-rule',    bg: 'bg-parchment',   text: 'text-ink' },
        pos:  { border: 'border-pos/30',  bg: 'bg-pos/[0.06]',  text: 'text-pos' },
    };

    return (
        <div className="max-w-lg mx-auto space-y-5 animate-fade-in-up">

            <div className="pt-2 pb-1 border-b border-rule text-center">
                <div className="data-label mb-1">Purchase Check</div>
                <h1 className="page-title">Wishlist</h1>
            </div>

            <div className="panel p-5 text-center">
                <div className="data-label mb-2">Current Total Balance</div>
                <div className="num text-4xl text-ink">
                    {loadingBal ? '—' : `₹${balance.toLocaleString('en-IN')}`}
                </div>
            </div>

            <div className="panel p-5">
                <form onSubmit={checkAffordability} className="space-y-4">
                    <div>
                        <label className="data-label block mb-2">I want to buy…</label>
                        <input type="text" value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })}
                            className="field-input w-full" placeholder="e.g. New Sneakers, iPhone, etc." required />
                    </div>
                    <div>
                        <label className="data-label block mb-2">It costs…</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sub font-sans">₹</span>
                            <input type="number" value={item.price} onChange={(e) => setItem({ ...item, price: e.target.value })}
                                className="field-input w-full pl-8 num text-2xl" placeholder="0" required />
                        </div>
                    </div>
                    <button type="submit" disabled={!item.price || loadingBal}
                        className="w-full bg-ink hover:bg-neutral-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2">
                        <Calculator size={15} /> Check Affordability
                    </button>
                </form>
            </div>

            {result && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                    <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setResult(null)} />
                    <div className="relative bg-sheet border border-rule rounded-t-2xl md:rounded-2xl w-full md:max-w-sm p-6 shadow-paper-lg animate-slide-up md:animate-in">
                        <button onClick={() => setResult(null)}
                            className="absolute top-4 right-4 w-7 h-7 rounded-lg text-dim hover:text-ink hover:bg-parchment flex items-center justify-center transition-all">
                            <X size={13} />
                        </button>
                        {(() => {
                            const style = STYLES[result.color];
                            const Icon = result.icon;
                            return (
                                <div className="text-center">
                                    <div className={`w-14 h-14 rounded-2xl ${style.bg} border ${style.border} flex items-center justify-center mx-auto mb-4`}>
                                        <Icon size={24} className={style.text} />
                                    </div>
                                    <h3 className={`font-serif font-bold italic text-2xl mb-2 ${style.text}`}>{result.verdict}</h3>
                                    <div className="data-label mb-1">{item.name}</div>
                                    <p className="text-sub text-sm leading-relaxed mb-5">{result.message}</p>
                                    {result.remaining >= 0 && (
                                        <div className={`panel p-4 mb-5 ${style.bg} border ${style.border}`}>
                                            <div className="data-label mb-1">Balance After Purchase</div>
                                            <div className="num text-xl text-ink">₹{result.remaining.toLocaleString('en-IN')}</div>
                                        </div>
                                    )}
                                    <button onClick={() => setResult(null)}
                                        className="w-full py-2.5 rounded-lg bg-parchment hover:bg-rule/50 text-ink text-sm font-medium transition-all border border-rule">
                                        Check Another
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wishlist;
