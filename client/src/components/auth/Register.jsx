import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight } from 'lucide-react';

const Register = () => {
    const authContext = useContext(AuthContext);
    const { register } = authContext;
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const { username, email, password } = formData;
    const [error, setError] = useState('');

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            await register({ username, email, password });
            navigate('/');
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            {/* Background Splashes */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="glass-card p-10 w-full max-w-md animate-fade-in-up z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/20">
                        <UserPlus size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Create Account</h1>
                    <p className="text-muted mt-2">Join the future of finance tracking</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={username}
                            onChange={onChange}
                            required
                            className="glass-input w-full"
                            placeholder="DesignGugu"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            required
                            className="glass-input w-full"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-wider text-muted mb-2 pl-1">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            required
                            minLength="6"
                            className="glass-input w-full"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white p-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-lg shadow-primary/25 flex justify-center items-center group"
                    >
                        Sign Up <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-muted">
                    Already have an account? <Link to="/login" className="text-primary hover:text-white transition-colors font-medium">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
