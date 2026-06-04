import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart2, PiggyBank, Bell } from 'lucide-react';

const HIGHLIGHTS = [
    { icon: BarChart2, bg: 'bg-indigo-500/20', ic: 'text-indigo-300', label: 'Spending Analytics', desc: 'Visual breakdowns of where your money goes.' },
    { icon: PiggyBank, bg: 'bg-pink-500/20',   ic: 'text-pink-300',   label: 'Savings Goals',      desc: 'Set jars and track progress toward goals.' },
    { icon: Bell,      bg: 'bg-amber-500/20',  ic: 'text-amber-300',  label: 'Smart Insights',     desc: 'Auto alerts when you approach limits.' },
];

const Register = () => {
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (formData.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try { await register(formData); navigate('/'); }
        catch (err) { setError(typeof err === 'string' ? err : 'Registration failed. Try again.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen flex bg-bg">

            {/* ── Left dark panel ── */}
            <div className="hidden lg:flex flex-col justify-between w-[460px] xl:w-[520px] flex-shrink-0 p-12 bg-[#0C0C0E] text-white relative overflow-hidden">
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
                        Get started free
                    </div>
                    <h2 className="font-extrabold text-white leading-[1.1] mb-5" style={{ fontSize: '2.8rem' }}>
                        Take charge of<br />
                        <span className="text-white/50">your finances.</span>
                    </h2>
                    <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                        Join thousands tracking smarter. Set up in under 2 minutes.
                    </p>

                    <div className="mt-10 space-y-3">
                        {HIGHLIGHTS.map(({ icon: Icon, bg, ic, label, desc }) => (
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

                    <div className="flex items-center gap-2 mb-10 lg:hidden">
                        <div className="w-7 h-7 bg-ink rounded-xl flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">MM</span>
                        </div>
                        <span className="font-extrabold text-ink text-sm">MoneyMap</span>
                    </div>

                    <h1 className="text-2xl font-bold text-ink mb-1">Create an account</h1>
                    <p className="text-sub text-sm mb-8">Start tracking your finances today</p>

                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-neg text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-3.5">
                        <div>
                            <label className="label block mb-2">Username</label>
                            <input type="text" name="username" value={formData.username} onChange={onChange} required
                                className="field-input w-full" placeholder="JohnDoe" autoComplete="username" />
                        </div>
                        <div>
                            <label className="label block mb-2">Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={onChange} required
                                className="field-input w-full" placeholder="you@example.com" autoComplete="email" />
                        </div>
                        <div>
                            <label className="label block mb-2">Password</label>
                            <input type="password" name="password" value={formData.password} onChange={onChange} required minLength="6"
                                className="field-input w-full" placeholder="Min. 6 characters" autoComplete="new-password" />
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full bg-ink hover:bg-ink/85 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-1 shadow-card-md">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account…
                                </span>
                            ) : (<>Create Account <ArrowRight size={16} /></>)}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-sub">
                        Already have an account?{' '}
                        <Link to="/login" className="text-ink font-semibold hover:underline underline-offset-2">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
