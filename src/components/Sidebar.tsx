'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    MonitorPlay,
    List,
    Trophy,
    Newspaper,
    Settings,
    Menu,
    X,
    LogOut,
    User,
    CreditCard,
    Ticket,
    Package,
    BarChart3,
    Inbox
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { name: 'Requests', icon: Inbox, href: '/requests' },
        { name: 'Analytics', icon: BarChart3, href: '/analytics' },
        { name: 'Matches', icon: LayoutDashboard, href: '/' },
        { name: 'Channels', icon: MonitorPlay, href: '/channels' },
        { name: 'Categories', icon: List, href: '/categories' },
        { name: 'Goals', icon: Trophy, href: '/goals' },
        { name: 'Highlights', icon: Video, href: '/highlights' },
        { name: 'News', icon: Newspaper, href: '/news' },
        { name: 'Users', icon: User, href: '/users' },
        { name: 'Packages', icon: Package, href: '/packages' },
        { name: 'Coupons', icon: Ticket, href: '/coupons' },
        { name: 'Payments', icon: CreditCard, href: '/payments' },
    ];

    return (
        <>
            {/* Mobile Toggle Button (Visible only on mobile) */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold text-emerald-400">
                    7ESEN<span className="text-white">CMS</span>
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar Container */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 transform transition-transform duration-300 ease-in-out font-sans flex flex-col
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                {/* Logo Area (Desktop) */}
                <div className="hidden md:flex items-center h-16 px-6 border-b border-slate-900/50">
                    <Link href="/" className="text-2xl font-bold text-emerald-400">
                        7ESEN<span className="text-white">CMS</span>
                    </Link>
                </div>

                {/* Mobile Header Spacer (to push content down below toggle bar) */}
                <div className="h-16 md:hidden"></div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
                        Collection Types
                    </div>

                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'bg-emerald-600 text-white'
                                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                    }
                                `}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Settings */}
                <div className="p-4 border-t border-slate-900/50">
                    <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors">
                        <Settings className="w-5 h-5 text-slate-500" />
                        Settings
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm('Are you sure you want to logout?')) {
                                await fetch('/api/auth/logout', { method: 'POST' });
                                window.location.href = '/login';
                            }
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors mt-1"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile when sidebar is open */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
