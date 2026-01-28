export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
            <div className="flex items-center justify-between mb-8">
                <div className="h-8 w-48 bg-slate-800 rounded"></div>
                <div className="h-10 w-32 bg-slate-800 rounded"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-48 bg-slate-900 rounded-xl border border-slate-800"></div>
                ))}
            </div>
        </div>
    );
}
