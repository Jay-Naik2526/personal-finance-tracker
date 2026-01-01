import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, ReceiptText, PieChart, Users, Menu, FileText, LogOut, Zap, Target, X, ShoppingBag } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const location = useLocation();
    const { logout } = useContext(AuthContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Primary mobile nav items (Critical actions)
    const mobilePrimaryItems = [
        { path: '/', label: 'Home', icon: <LayoutDashboard size={20} /> },
        { path: '/savings', label: 'Save', icon: <Target size={20} /> },
        { path: '/add', label: 'Add', icon: <ReceiptText size={24} />, isFab: true },
        { path: '/budgets', label: 'Budget', icon: <Wallet size={20} /> },
    ];

    // Secondary items for the "More" menu
    const menuItems = [
        { path: '/wishlist', label: 'Wishlist Check', icon: <ShoppingBag size={20} /> },
        { path: '/split', label: 'Split Bill', icon: <Users size={20} /> },
        { path: '/analytics', label: 'Analytics', icon: <PieChart size={20} /> },
        { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
        { path: '/debts', label: 'Debts', icon: <Users size={20} /> },
        { path: '/subscriptions', label: 'Subscriptions', icon: <Zap size={20} /> },
    ];

    // Desktop shows everything
    const desktopItems = [
        { path: '/', label: 'Overview', icon: <LayoutDashboard size={20} /> },
        { path: '/add', label: 'Add Transaction', icon: <ReceiptText size={20} /> },
        { path: '/budgets', label: 'Budgets', icon: <Wallet size={20} /> },
        { path: '/savings', label: 'Savings', icon: <Target size={20} /> },
        { path: '/split', label: 'Split Bill', icon: <Users size={20} /> },
        { path: '/wishlist', label: 'Wishlist', icon: <ShoppingBag size={20} /> },
        { path: '/subscriptions', label: 'Subscriptions', icon: <Zap size={20} /> },
        { path: '/analytics', label: 'Analytics', icon: <PieChart size={20} /> },
        { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
        { path: '/debts', label: 'Debts', icon: <Users size={20} /> },
    ];

    return (
        <>
            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-900/90 backdrop-blur-xl border-t border-white/5 flex justify-around items-center z-50 px-2 animate-slide-up pb-2">
                {mobilePrimaryItems.map((item) => (
                    item.isFab ? (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-indigo-500 shadow-lg shadow-primary/40 flex items-center justify-center text-white -mt-6 hover:scale-105 transition-transform"
                        >
                            {item.icon}
                        </Link>
                    ) : (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${location.pathname === item.path
                                ? 'text-primary'
                                : 'text-muted hover:text-white'
                                }`}
                        >
                            {item.icon}
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    )
                ))}

                {/* Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="flex flex-col items-center gap-1 p-2 text-muted hover:text-white transition-colors"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </nav>

            {/* Mobile Menu Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 rounded-t-3xl p-6 animate-slide-up-fast">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Menu</h3>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-white/5 rounded-full text-muted">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-8">
                            {menuItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all ${location.pathname === item.path ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-white/5 hover:bg-white/10'}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-xs text-muted font-medium text-center">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        <button
                            onClick={logout}
                            className="w-full py-4 rounded-xl bg-rose-500/10 text-rose-400 font-bold flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-colors"
                        >
                            <LogOut size={20} /> Logout
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Sidebar */}
            <nav className="hidden md:flex flex-col w-72 h-screen p-6 fixed left-0 top-0 z-50">
                <div className="glass-card h-full w-full flex flex-col p-6">
                    <div className="flex items-center gap-3 mb-10 px-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-white">
                            FT
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            FinanceTrack
                        </h1>
                    </div>

                    <div className="flex flex-col gap-2">
                        {desktopItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center p-3 rounded-xl transition-all duration-300 group ${location.pathname === item.path
                                    ? 'bg-primary/20 text-white border border-primary/20 shadow-lg shadow-primary/5'
                                    : 'text-muted hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span className={`mr-3 transition-colors ${location.pathname === item.path ? 'text-primary' : 'text-muted group-hover:text-white'}`}>
                                    {item.icon}
                                </span>
                                <span className="font-medium text-sm tracking-wide">{item.label}</span>

                            </Link>
                        ))}
                        <button
                            onClick={logout}
                            className="flex items-center p-3 rounded-xl transition-all duration-300 group text-muted hover:text-rose-400 hover:bg-rose-500/10 mt-auto"
                        >
                            <span className="mr-3 transition-colors text-muted group-hover:text-rose-400">
                                <LogOut size={20} />
                            </span>
                            <span className="font-medium text-sm tracking-wide">Logout</span>
                        </button>
                    </div>

                    <div className="pt-6 border-t border-white/5 text-xs text-muted/50 text-center">
                        v1.0.0 Student Edition
                    </div>
                </div>
            </nav>

            {/* Spacer for desktop layout since nav is fixed */}
            <div className="hidden md:block w-72 flex-shrink-0"></div>
        </>
    );
};

export default Navbar;
