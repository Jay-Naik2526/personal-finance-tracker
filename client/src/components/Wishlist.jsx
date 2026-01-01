import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Calculator, CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Wishlist = () => {
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);

    const [item, setItem] = useState({
        name: '',
        price: ''
    });

    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchBalance();
    }, []);

    const fetchBalance = async () => {
        try {
            const res = await axios.get('/api/dashboard/stats');
            setBalance(res.data.totalBalance);
        } catch (err) { }
        finally { setLoading(false); }
    };

    const checkAffordability = (e) => {
        e.preventDefault();
        const price = parseFloat(item.price);
        if (!price) return;

        // If balance is 0 or uninitialized
        if (balance === 0) {
            setResult({
                verdict: 'No Funds.',
                color: 'rose',
                icon: <XCircle size={48} />,
                message: `Your tracking balance is 0. Add some income or transactions first to calculate accurately!`,
                remaining: -price
            });
            return;
        }

        const remaining = balance - price;
        const ratio = (price / balance) * 100;

        let verdict = '';
        let color = '';
        let icon = null;
        let message = '';

        if (remaining < 0) {
            verdict = 'Nope.';
            color = 'rose';
            icon = <XCircle size={48} />;
            message = `You are short by ₹${Math.abs(remaining).toLocaleString()}.`;
        }
        // Logic Update: Only considered risky if remaining is very low (< 10% of balance AND < 500)
        else if (remaining < 500 && remaining < (balance * 0.1)) {
            verdict = 'Risky.';
            color = 'amber';
            icon = <AlertTriangle size={48} />;
            message = `You'll be left with only ₹${remaining.toLocaleString()}. That's cutting it close!`;
        }
        else if (ratio > 60) {
            verdict = 'Big Item.';
            color = 'blue';
            icon = <AlertTriangle size={48} />;
            message = `This takes up ${Math.round(ratio)}% of your money. It's affordable, but a major chunk.`;
        }
        else {
            verdict = 'Go for it!';
            color = 'emerald';
            icon = <CheckCircle size={48} />;
            message = `You'll still have ₹${remaining.toLocaleString()} left comfortably. Treat yourself!`;
        }

        setResult({ verdict, color, icon, message, remaining });
    };

    return (
        <div className="max-w-xl mx-auto space-y-6 animate-fade-in-up pb-24">
            <header className="mb-8 text-center">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 mb-2 flex items-center justify-center gap-3">
                    <ShoppingBag className="text-pink-400" /> Wishlist Check
                </h2>
                <p className="text-muted">Can you afford that shiny new thing?</p>
            </header>

            <div className={`glass-card p-8 transition-all duration-500 ${result ? 'scale-95 opacity-50 blur-[1px]' : 'scale-100'}`}>
                <div className="text-center mb-6">
                    <div className="text-sm text-muted uppercase tracking-wider mb-1">Current Balance</div>
                    <div className="text-4xl font-bold text-white">₹{balance.toLocaleString()}</div>
                </div>

                <form onSubmit={checkAffordability} className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">I want to buy...</label>
                        <input
                            type="text"
                            value={item.name}
                            onChange={(e) => setItem({ ...item, name: e.target.value })}
                            className="glass-input w-full"
                            placeholder="e.g. New Sneakers"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">It costs...</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-white/50 text-lg">₹</span>
                            <input
                                type="number"
                                value={item.price}
                                onChange={(e) => setItem({ ...item, price: e.target.value })}
                                className="glass-input w-full pl-10 text-xl font-bold"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!item.price || loading}
                        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white p-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-pink-500/25 flex justify-center items-center gap-2"
                    >
                        <Calculator size={18} /> Can I Afford It?
                    </button>
                </form>
            </div>

            {/* Verdict Modal/Card */}
            {result && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setResult(null)}></div>
                    <div className={`relative bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center gap-4`}>
                        <div className={`text-${result.color}-400 mb-2`}>
                            {result.icon}
                        </div>

                        <h3 className={`text-4xl font-bold text-${result.color}-400 mb-1`}>{result.verdict}</h3>
                        <p className="text-white/80 text-lg leading-relaxed">{result.message}</p>

                        {result.remaining >= 0 && (
                            <div className="my-4 p-3 bg-white/5 rounded-xl w-full">
                                <div className="text-xs text-muted mb-1">New Balance</div>
                                <div className="text-xl font-mono text-white">₹{result.remaining.toLocaleString()}</div>
                            </div>
                        )}

                        <button
                            onClick={() => setResult(null)}
                            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                        >
                            Check Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wishlist;
