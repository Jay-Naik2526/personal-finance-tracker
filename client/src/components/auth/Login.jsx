import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, ShieldCheck, Layers } from 'lucide-react';

const FEATURES = [
    { icon: TrendingUp,  bg: 'bg-green-500/20',  ic: 'text-green-300',  label: 'Real-time Analytics',  desc: 'Track spending patterns with live charts.' },
    { icon: ShieldCheck, bg: 'bg-blue-500/20',   ic: 'text-blue-300',   label: 'Budget Control',        desc: 'Set limits and get alerts before overspending.' },
    { icon: Layers,      bg: 'bg-purple-500/20', ic: 'text-purple-300', label: 'Multi-wallet',          desc: 'Manage cash and online balances together.' },
];

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try { await login(formData); navigate('/'); }
        catch (err) { setError(err.response?.data?.msg || 'Invalid credentials.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex bg-bg">

            {/* ── Left dark panel ── */}
            <div className="hidden lg:flex flex-col justify-between w-[460px] xl:w-[520px] flex-shrink-0 p-12 bg-[#0C0C0E] text-white relative overflow-hidden">
                {/* Subtle grid */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="relative z-10 flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                        <span className="text-ink text-[11px] font-bold">MM</span>
                    </div>
                    <span className="font-extrabold text-white text-base tracking-tight">MoneyMap</span>
                </div>

                <div className="relative z-10">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/30 mb-4">
                        Personal Finance Tracker
                    </div>
                    <h2 className="font-extrabold text-white leading-[1.1] mb-5" style={{ fontSize: '2.8rem' }}>
                        Your money,<br />
                        <span className="text-white/50">under control.</span>
                    </h2>
                    <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                        Track every rupee, stay within budget, and build wealth — one transaction at a time.
                    </p>

                    <div className="mt-10 space-y-3">
                        {FEATURES.map(({ icon: Icon, bg, ic, label, desc }) => (
                            <div key={label} className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon size={15} className={ic} />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-semibold">{label}</div>
                                    <div className="text-white/40 text-xs mt-0.5">{desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 text-white/20 text-xs">© {new Date().getFullYear()} MoneyMap</div>
            </div>

            {/* ── Right form ── */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-16">
                <div className="w-full max-w-sm">

                    {/* Mobile brand */}
                    <div className="flex items-center gap-2 mb-10 lg:hidden">
                        <div className="w-7 h-7 bg-ink rounded-xl flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">MM</span>
                        </div>
                        <span className="font-extrabold text-ink text-sm">MoneyMap</span>
                    </div>

                    <h1 className="text-2xl font-bold text-ink mb-1">Welcome back</h1>
                    <p className="text-sub text-sm mb-8">Sign in to continue tracking</p>

                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-neg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <div>
                            <label className="label block mb-2">Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={onChange} required
                                className="field-input w-full" placeholder="you@example.com" autoComplete="email" />
                        </div>
                        <div>
                            <label className="label block mb-2">Password</label>
                            <input type="password" name="password" value={formData.password} onChange={onChange} required
                                className="field-input w-full" placeholder="••••••••" autoComplete="current-password" />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-ink hover:bg-ink/85 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-1 shadow-card-md">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in…
                                </span>
                            ) : (<>Sign In <ArrowRight size={16} /></>)}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-sub">
                        No account?{' '}
                        <Link to="/register" className="text-ink font-semibold hover:underline underline-offset-2">
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
