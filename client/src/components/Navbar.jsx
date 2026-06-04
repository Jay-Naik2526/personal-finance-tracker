import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, Wallet, Target, PieChart, Plus, MoreHorizontal,
    FileText, Users, Zap, ShoppingBag, LogOut, X, ReceiptText, Compass
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : 'U');

const primaryNav = [
    { path: '/', label: 'Overview', icon: LayoutGrid },
    { path: '/budgets', label: 'Budgets', icon: Wallet },
    { path: '/savings', label: 'Savings', icon: Target },
    { path: '/analytics', label: 'Analytics', icon: PieChart },
];

const moreNav = [
    { path: '/split', label: 'Split Bill', icon: Users },
    { path: '/wishlist', label: 'Wishlist', icon: ShoppingBag },
    { path: '/subscriptions', label: 'Subscriptions', icon: Zap },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/debts', label: 'Debts', icon: ReceiptText },
];

const allNav = [...primaryNav, ...moreNav];

const iconTints = {
    '/':              { bg: 'bg-blue-50',   text: 'text-blue-600' },
    '/budgets':       { bg: 'bg-green-50',  text: 'text-green-600' },
    '/savings':       { bg: 'bg-purple-50', text: 'text-purple-600' },
    '/analytics':     { bg: 'bg-amber-50',  text: 'text-amber-600' },
    '/split':         { bg: 'bg-pink-50',   text: 'text-pink-600' },
    '/wishlist':      { bg: 'bg-red-50',    text: 'text-red-500' },
    '/subscriptions': { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    '/reports':       { bg: 'bg-teal-50',   text: 'text-teal-600' },
    '/debts':         { bg: 'bg-orange-50', text: 'text-orange-600' },
};

const Navbar = () => {
    const location = useLocation();
    const { logout, user } = useContext(AuthContext);
    const [radialOpen, setRadialOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [hoveredLabel, setHoveredLabel] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const isActive = (path) => location.pathname === path;
    const currentPage = allNav.find(n => n.path === location.pathname)?.label || 'Overview';

    // Track window resize for responsive dial coordinates
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close radial menu on navigation
    useEffect(() => {
        setRadialOpen(false);
    }, [location.pathname]);

    // Define positions for desktop radial items
    const innerItems = [
        { path: '/', label: 'Overview', icon: LayoutGrid, angle: 180 },
        { path: '/budgets', label: 'Budgets', icon: Wallet, angle: 202.5 },
        { path: '/savings', label: 'Savings', icon: Target, angle: 225 },
        { path: '/analytics', label: 'Analytics', icon: PieChart, angle: 247.5 },
        { path: '/add', label: 'Add Transaction', icon: Plus, angle: 270, isAdd: true }
    ];

    const outerItems = [
        { path: '/split', label: 'Split Bill', icon: Users, angle: 180 },
        { path: '/wishlist', label: 'Wishlist', icon: ShoppingBag, angle: 202.5 },
        { path: '/subscriptions', label: 'Subscriptions', icon: Zap, angle: 225 },
        { path: '/reports', label: 'Reports', icon: FileText, angle: 247.5 },
        { path: '/debts', label: 'Debts', icon: ReceiptText, angle: 270 }
    ];

    // Define positions for mobile radial items (vertical stack heights above trigger)
    const mobileItems = [
        { path: '/', label: 'Overview', icon: LayoutGrid, mobileY: 65 },
        { path: '/budgets', label: 'Budgets', icon: Wallet, mobileY: 120 },
        { path: '/savings', label: 'Savings', icon: Target, mobileY: 175 },
        { path: '/analytics', label: 'Analytics', icon: PieChart, mobileY: 230 },
        { label: 'More', icon: MoreHorizontal, mobileY: 285, isMore: true }
    ];

    const getRadialStyles = (angle, radius, isOpen, index, mobileY) => {
        if (isMobile) {
            // Mobile: Vertical stack directly above the trigger
            return {
                transform: isOpen
                    ? `translate(0, -${mobileY}px) scale(1)`
                    : 'translate(0, 0) scale(0.3)',
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? `${index * 35}ms` : '0ms',
                pointerEvents: isOpen ? 'auto' : 'none'
            };
        } else {
            // Desktop: Circular radial orbits
            const angleRad = (angle * Math.PI) / 180;
            const x = radius * Math.cos(angleRad);
            const y = radius * Math.sin(angleRad);
            return {
                transform: isOpen
                    ? `translate(${x}px, ${y}px) scale(1)`
                    : 'translate(0, 0) scale(0.3)',
                opacity: isOpen ? 1 : 0,
                transitionDelay: isOpen ? `${index * 35}ms` : '0ms',
                pointerEvents: isOpen ? 'auto' : 'none'
            };
        }
    };

    // Calculate dynamic coordinates/dimensions based on screen type (Desktop Only)
    const svgTranslate = 'translate(36px, 36px)';
    const svgPathInner = "M -36 -36 A 170 170 0 0 0 -206 -36";
    const svgPathOuter = "M -36 -36 A 260 260 0 0 0 -296 -36";

    return (
        <>
            {/* ─── WATERMARK LOGO (FLOATS TOP-LEFT ON ALL SCREENS) ──────────────── */}
            <div className="fixed top-5 left-5 md:top-6 md:left-6 z-50 flex items-center gap-2.5 bg-surface/80 backdrop-blur-md border border-border px-3.5 py-2 md:px-4 md:py-2.5 rounded-2xl shadow-card select-none">
                <img src="/logo.png" alt="MoneyMap Logo" className="w-5 h-5 md:w-6 md:h-6 object-contain flex-shrink-0 rounded-md" />
                <span className="text-ink font-extrabold text-[12px] md:text-[13px] tracking-tight">MoneyMap</span>
            </div>

            {/* ─── DIRECT ADD TRANSACTION FAB (FLOATS BOTTOM-LEFT ON MOBILE) ──────── */}
            {isMobile && (
                <Link
                    to="/add"
                    className="fixed bottom-8 left-8 z-[95] w-14 h-14 bg-ink text-white rounded-full flex items-center justify-center shadow-xl border border-border/10 transition-all hover:scale-105 active:scale-95 shadow-ink/20"
                >
                    <Plus size={24} strokeWidth={2.5} />
                </Link>
            )}

            {/* ─── BLURRY BACKDROP BLUR FOR RADIAL OPEN ──────────────────────────── */}
            <div
                onClick={() => setRadialOpen(false)}
                className={`fixed inset-0 bg-ink/10 backdrop-blur-[2px] transition-opacity duration-300 z-[90] ${
                    radialOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            />

            {/* ─── HUD RADIAL DIAL MENU (ALL SCREENS) ────────── */}
            <div className={`fixed z-[100] w-0 h-0 transition-all duration-300 ${
                isMobile ? 'bottom-8 right-8' : 'bottom-12 right-12'
            }`}>
                
                {/* HUD Orbital Connection Lines (SVG) - Desktop Only */}
                {!isMobile && (
                    <svg className={`absolute bottom-0 right-0 pointer-events-none transition-all duration-700 ease-out ${
                        radialOpen ? 'opacity-40 scale-100' : 'opacity-0 scale-75'
                    } w-[340px] h-[340px]`} style={{ transform: svgTranslate }}>
                        <path
                            d={svgPathInner}
                            fill="none"
                            className="stroke-sub stroke-[2] stroke-dashed"
                            strokeDasharray="5 5"
                        />
                        <path
                            d={svgPathOuter}
                            fill="none"
                            className="stroke-sub stroke-[2]"
                            strokeDasharray="8 4"
                        />
                    </svg>
                )}

                {/* MOBILE VIEW NAVIGATION RING (Vertical Stack List with Labels on Left) */}
                {isMobile && mobileItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = item.path && isActive(item.path);
                    
                    const triggerAction = () => {
                        if (item.isMore) {
                            setDrawerOpen(true);
                            setRadialOpen(false);
                        }
                    };

                    return (
                        <React.Fragment key={index}>
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    style={getRadialStyles(item.angle, 0, radialOpen, index, item.mobileY)}
                                    className="absolute bottom-0 right-0 flex items-center justify-end gap-3 -mr-[22px] -mb-[22px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                                >
                                    <span className={`bg-surface border border-border px-3 py-1.5 rounded-xl text-ink text-[11px] font-bold shadow-md transition-all duration-300 whitespace-nowrap ${
                                        radialOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
                                    }`}>
                                        {item.label}
                                    </span>
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-lg ${
                                        active
                                            ? 'bg-ink border-ink text-white'
                                            : 'bg-surface border-border text-sub hover:text-ink'
                                    }`}>
                                        <Icon size={16} strokeWidth={2.5} />
                                    </div>
                                </Link>
                            ) : (
                                <button
                                    onClick={triggerAction}
                                    style={getRadialStyles(item.angle, 0, radialOpen, index, item.mobileY)}
                                    className="absolute bottom-0 right-0 flex items-center justify-end gap-3 -mr-[22px] -mb-[22px] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                                >
                                    <span className={`bg-surface border border-border px-3 py-1.5 rounded-xl text-ink text-[11px] font-bold shadow-md transition-all duration-300 whitespace-nowrap ${
                                        radialOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
                                    }`}>
                                        {item.label}
                                    </span>
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center border shadow-lg bg-surface border-border text-sub hover:text-ink">
                                        <Icon size={16} strokeWidth={2.5} />
                                    </div>
                                </button>
                            )}
                        </React.Fragment>
                    );
                })}

                {/* DESKTOP VIEW NAVIGATION RING (Double Rings) */}
                {!isMobile && innerItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={getRadialStyles(item.angle, 170, radialOpen, index)}
                            onMouseEnter={() => setHoveredLabel(item.label)}
                            onMouseLeave={() => setHoveredLabel('')}
                            className={`absolute w-14 h-14 -ml-7 -mt-7 rounded-full flex items-center justify-center border shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-115 active:scale-95 ${
                                item.isAdd
                                    ? 'bg-ink border-ink text-white hover:bg-ink/80 shadow-ink/20 shadow-xl'
                                    : active
                                        ? 'bg-ink border-ink text-white'
                                        : 'bg-surface border-border text-sub hover:text-ink hover:border-border-strong'
                            }`}
                        >
                            <Icon size={20} strokeWidth={2.5} />
                        </Link>
                    );
                })}

                {/* DESKTOP VIEW OUTER RING */}
                {!isMobile && outerItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={getRadialStyles(item.angle, 260, radialOpen, index)}
                            onMouseEnter={() => setHoveredLabel(item.label)}
                            onMouseLeave={() => setHoveredLabel('')}
                            className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center border shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-115 active:scale-95 ${
                                active
                                    ? 'bg-ink border-ink text-white'
                                    : 'bg-surface border-border text-sub hover:text-ink hover:border-border-strong'
                            }`}
                        >
                            <Icon size={16} />
                        </Link>
                    );
                })}

                {/* DESKTOP VIEW LOGOUT QUICK TRIGGER */}
                {!isMobile && (
                    <button
                        onClick={logout}
                        title="Sign Out"
                        style={getRadialStyles(148, 260, radialOpen, 5)}
                        onMouseEnter={() => setHoveredLabel('Sign Out')}
                        onMouseLeave={() => setHoveredLabel('')}
                        className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center border border-red-100 bg-red-50 text-red-600 shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-red-100 hover:scale-115 active:scale-95"
                    >
                        <LogOut size={16} />
                    </button>
                )}

                {/* CORE DIAL TRIGGER BUTTON */}
                <button
                    onClick={() => setRadialOpen(!radialOpen)}
                    onMouseEnter={() => !radialOpen && setHoveredLabel('Navigation Menu')}
                    onMouseLeave={() => setHoveredLabel('')}
                    className={`absolute rounded-full flex items-center justify-center shadow-xl border transition-all duration-500 z-50 group ${
                        isMobile
                            ? 'w-14 h-14 -ml-7 -mt-7'
                            : 'w-18 h-18 -ml-9 -mt-9'
                    } ${
                        radialOpen
                            ? 'bg-ink border-ink text-white rotate-180 scale-105'
                            : 'bg-surface border-border text-ink hover:border-border-strong hover:scale-105'
                    }`}
                >
                    {radialOpen ? (
                        <X size={isMobile ? 20 : 24} strokeWidth={2.5} className="animate-in" />
                    ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Ambient Pulsing outer ring */}
                            <span className="absolute inset-0 rounded-full border border-ink/10 animate-ping opacity-75" />
                            {/* Navigation Compass Icon */}
                            <Compass size={isMobile ? 26 : 32} strokeWidth={2} className="text-ink transition-transform duration-700 ease-out group-hover:rotate-45" />
                        </div>
                    )}
                </button>

                {/* Info HUD Label (Fades in on hover, positioned at the top-left of the HUD hub clear of any rings) - Desktop Only */}
                {!isMobile && (
                    <div className={`absolute bg-ink text-white font-bold px-4 py-2.5 rounded-2xl shadow-2xl border border-white/10 whitespace-nowrap transition-all duration-300 pointer-events-none tracking-wide z-[120] bottom-[310px] right-[20px] text-[13px] ${
                        radialOpen && hoveredLabel ? 'opacity-100 -translate-y-3' : 'opacity-0 translate-y-0'
                    }`}>
                        {hoveredLabel}
                    </div>
                )}
            </div>

            {/* ─── MOBILE DRAWER (SLIDE-UP FROM BOTTOM FOR 'MORE' LINKS) ───────── */}
            {drawerOpen && (
                <div className="fixed inset-0 z-[110] md:hidden">
                    <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
                    <div className="absolute inset-x-0 bottom-0 bg-surface rounded-t-3xl p-5 shadow-float animate-slide-up">
                        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

                        <div className="grid grid-cols-4 gap-3 mb-5">
                            {allNav.map(({ path, label, icon: Icon }) => {
                                const tint = iconTints[path] || { bg: 'bg-gray-50', text: 'text-gray-600' };
                                const active = isActive(path);
                                return (
                                    <Link
                                        key={path}
                                        to={path}
                                        onClick={() => setDrawerOpen(false)}
                                        className="flex flex-col items-center gap-1.5"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                            active ? 'bg-ink text-white' : `${tint.bg} ${tint.text}`
                                        }`}>
                                            <Icon size={20} />
                                        </div>
                                        <span className="text-[10px] text-sub font-semibold text-center leading-tight">{label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="border-t border-border pt-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-white text-xs font-bold">
                                    {getInitial(user?.username)}
                                </div>
                                <div>
                                    <div className="text-ink text-sm font-semibold">{user?.username || 'User'}</div>
                                    <div className="text-sub text-[10px]">{user?.email || ''}</div>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-1.5 text-neg text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 transition-all"
                            >
                                <LogOut size={13} /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
