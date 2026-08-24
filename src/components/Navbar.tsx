import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-surface border-b border-line sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold text-ink tracking-tight">
                            7ESEN<span className="text-accent">TV</span>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-1">
                            <Link href="/" className="px-3 py-2 rounded-[10px] text-sm font-medium text-inksoft hover:bg-surface2 hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                                Matches
                            </Link>
                            <Link href="/channels" className="px-3 py-2 rounded-[10px] text-sm font-medium text-inksoft hover:bg-surface2 hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                                Channels
                            </Link>
                            <Link href="/news" className="px-3 py-2 rounded-[10px] text-sm font-medium text-inksoft hover:bg-surface2 hover:text-ink transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                                News
                            </Link>
                            <Link href="/users" className="px-3 py-2 rounded-[10px] text-sm font-medium text-accentstrong hover:bg-accentsoft transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none">
                                Users
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none" aria-label="Search">
                            <Search className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            aria-label="Toggle menu"
                            className="md:hidden p-2 rounded-lg text-inkmute hover:text-ink hover:bg-surface2 transition-colors focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none"
                        >
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-surface border-b border-line">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            href="/"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-[10px] text-base font-medium text-inksoft hover:bg-surface2 hover:text-ink transition-colors"
                        >
                            Matches
                        </Link>
                        <Link
                            href="/channels"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-[10px] text-base font-medium text-inksoft hover:bg-surface2 hover:text-ink transition-colors"
                        >
                            Channels
                        </Link>
                        <Link
                            href="/news"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-[10px] text-base font-medium text-inksoft hover:bg-surface2 hover:text-ink transition-colors"
                        >
                            News
                        </Link>
                        <Link
                            href="/users"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-[10px] text-base font-medium text-accentstrong hover:bg-accentsoft transition-colors"
                        >
                            Users
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
