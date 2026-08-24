'use client';

import { useState } from 'react';
import { Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                window.location.href = '/';
            } else {
                setError(data.error || 'Invalid credentials');
            }
        } catch {
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="flex items-center justify-center gap-3 mb-6">
                    <img src="/logo.png" alt="7esen TV" className="w-10 h-10 rounded-[10px] object-cover" />
                    <span className="text-xl font-bold text-ink">7esen <span className="text-accent">TV</span></span>
                </div>

                <div className="bg-surface border border-line rounded-2xl shadow-cardhover p-6 md:p-8">
                    <h1 className="text-lg font-semibold text-gradient-brand">Admin Dashboard Login</h1>
                    <p className="text-sm text-inksoft mt-1">Secure Admin Access Only</p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-ink mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-inkmute pointer-events-none" />
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-11 pr-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-inkmute pointer-events-none" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-surface2 border border-line focus:border-accent/60 focus:bg-surface rounded-[10px] pl-11 pr-3 py-2 text-sm text-ink placeholder:text-inkmute outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/40"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 bg-dangersoft text-danger rounded-[10px] px-3 py-2 text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-gradient-red text-white rounded-[10px] px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:outline-none disabled:opacity-40 disabled:pointer-events-none"
                        >
                            {loading ? 'Signing in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
