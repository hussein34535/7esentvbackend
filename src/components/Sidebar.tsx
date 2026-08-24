'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    MonitorPlay,
    List,
    Trophy,
    Settings,
    Menu,
    X,
    LogOut,
    User,
    CreditCard,
    Ticket,
    Package,
    BarChart3,
    Inbox,
    Video,
    Film,
    Sun,
    Moon
} from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isDark, setIsDark] = useState<boolean | null>(null);

    useEffect(() => {
        const el = document.documentElement;
        const apply = () => setIsDark(el.classList.contains('dark'));
        const raf = requestAnimationFrame(apply);
        const obs = new MutationObserver(apply);
        obs.observe(el, { attributes: true, attributeFilter: ['class'] });
        return () => {
            cancelAnimationFrame(raf);
            obs.disconnect();
        };
    }, []);

    const toggleTheme = () => {
        const next = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', next);
        try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { }
    };

    const sections = [
        {
            label: 'Content',
            items: [
                { name: 'Matches', icon: LayoutDashboard, href: '/' },
                { name: 'Channels', icon: MonitorPlay, href: '/channels' },
                { name: 'Categories', icon: List, href: '/categories' },
                { name: 'Goals', icon: Trophy, href: '/goals' },
                { name: 'Highlights', icon: Video, href: '/highlights' },
                { name: 'مباريات كاملة', icon: Film, href: '/news' },
            ],
        },
        {
            label: 'Business',
            items: [
                { name: 'Users', icon: User, href: '/users' },
                { name: 'Packages', icon: Package, href: '/packages' },
                { name: 'Coupons', icon: Ticket, href: '/coupons' },
                { name: 'Payments', icon: CreditCard, href: '/payments' },
            ],
        },
        {
            label: 'Insights',
            items: [
                { name: 'Requests', icon: Inbox, href: '/requests' },
                { name: 'Analytics', icon: BarChart3, href: '/analytics' },
            ],
        },
    ];

    return (
        <>
            {/* Mobile top bar — frosted */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-line p-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-lg font-bold text-ink">
                    <img src="/logo.png" alt="7esen TV" className="w-7 h-7 rounded-[8px] object-cover" />
                    <span>7esen <span className="text-accent">TV</span></span>
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                    className="p-2 text-inksoft hover:text-ink rounded-lg hover:bg-surface2 transition-colors"
                >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-line flex flex-col font-sans
                transition-transform duration-300 ease-out
                ${isOpen ? 'translate-x-0 shadow-cardhover' : '-translate-x-full'}
                md:relative md:translate-x-0 md:shadow-none
            `}>
                {/* Logo (desktop) */}
                <div className="hidden md:flex items-center h-16 px-6 border-b border-line shrink-0">
                    <Link href="/" className="flex items-center gap-3 text-xl font-bold text-ink">
                        <img src="/logo.png" alt="7esen TV" className="w-8 h-8 rounded-[9px] object-cover" />
                        <span>7esen <span className="text-accent">TV</span></span>
                    </Link>
                </div>

                {/* Mobile header spacer */}
                <div className="h-16 md:hidden"></div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
                    {sections.map((section) => (
                        <div key={section.label}>
                            <div className="text-[11px] font-semibold text-inkmute mb-1.5 px-3">
                                {section.label}
                            </div>
                            <div className="space-y-0.5">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/' && pathname.startsWith(item.href)) ||
                                        (item.href === '/' && (pathname === '/' || pathname.startsWith('/matches')));

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className={`
                                                flex items-center gap-3 px-3 py-2 rounded-[10px] text-sm font-medium transition-all duration-200
                                                ${isActive
                                                    ? 'bg-accentsoft text-accentstrong'
                                                    : 'text-inksoft hover:bg-surface2 hover:text-ink'
                                                }
                                            `}
                                        >
                                            <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-accentstrong' : 'text-inkmute'}`} />
                                            <span className="truncate">{item.name}</span>
                                            {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom actions */}
                <div className="p-3 border-t border-line shrink-0">
                    <button
                        onClick={toggleTheme}
                        aria-label="Toggle dark mode"
                        className="flex items-center gap-3 px-3 py-2 w-full rounded-[10px] text-sm font-medium text-inksoft hover:bg-surface2 hover:text-ink transition-colors"
                    >
                        {isDark
                            ? <Sun className="w-[18px] h-[18px] text-warn" />
                            : <Moon className="w-[18px] h-[18px] text-inkmute" />}
                        {isDark === null ? 'Theme' : isDark ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <button className="flex items-center gap-3 px-3 py-2 w-full rounded-[10px] text-sm font-medium text-inksoft hover:bg-surface2 hover:text-ink transition-colors">
                        <Settings className="w-[18px] h-[18px] text-inkmute" />
                        Settings
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm('Are you sure you want to logout?')) {
                                await fetch('/api/auth/logout', { method: 'POST' });
                                window.location.href = '/login';
                            }
                        }}
                        className="flex items-center gap-3 px-3 py-2 w-full rounded-[10px] text-sm font-medium text-danger hover:bg-dangersoft transition-colors mt-0.5"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 z-30 bg-ink/20"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
