import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-2xl font-bold text-emerald-400">
                            7ESEN<span className="text-white">TV</span>
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition">
                                Matches
                            </Link>
                            <Link href="/channels" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition">
                                Channels
                            </Link>
                            <Link href="/news" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition">
                                News
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 rounded-full hover:bg-slate-800 transition">
                            <Search className="w-5 h-5 text-gray-300" />
                        </button>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden p-2 rounded-full hover:bg-slate-800 transition"
                        >
                            {isOpen ? <X className="w-6 h-6 text-gray-300" /> : <Menu className="w-6 h-6 text-gray-300" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-slate-900 border-b border-slate-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            href="/"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800 transition"
                        >
                            Matches
                        </Link>
                        <Link
                            href="/channels"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800 transition"
                        >
                            Channels
                        </Link>
                        <Link
                            href="/news"
                            onClick={() => setIsOpen(false)}
                            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-slate-800 transition"
                        >
                            News
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
