export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-pulse">
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <div className="h-7 w-48 bg-surface2 rounded-lg"></div>
                    <div className="h-4 w-28 bg-surface2 rounded-md"></div>
                </div>
                <div className="h-10 w-32 bg-surface2 rounded-[10px]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-44 bg-surface rounded-2xl border border-line shadow-card"></div>
                ))}
            </div>
        </div>
    );
}
