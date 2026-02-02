import Link from 'next/link';
import { Plus, Trash2, Edit, Video, Star } from 'lucide-react';
import { getHighlights, deleteHighlight } from '@/app/actions';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function HighlightsPage() {
    const highlights = await getHighlights();

    return (
        <div className="font-sans">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Highlights
                    </h1>
                    <p className="text-slate-400 mt-1">Manage game highlights and recaps</p>
                </div>
                <Link
                    href="/highlights/new"
                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02]"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Highlight</span>
                </Link>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {highlights.map((item: any) => {
                    // Extract image URL safely
                    let imgUrl = '/placeholder.png';
                    if (item.image) {
                        if (typeof item.image === 'string') imgUrl = item.image;
                        else if (Array.isArray(item.image) && item.image[0]) imgUrl = item.image[0].secure_url || item.image[0].url;
                        else if (item.image.secure_url) imgUrl = item.image.secure_url;
                        else if (item.image.url) imgUrl = item.image.url;
                    }

                    return (
                        <div key={item.id} className="group bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition">
                            {/* Image Area */}
                            <div className="relative h-48 bg-slate-950">
                                {imgUrl && (
                                    <Image
                                        src={imgUrl}
                                        alt={item.title || 'Highlight'}
                                        fill
                                        className="object-cover group-hover:scale-105 transition duration-500"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />

                                <div className="absolute top-3 right-3 flex gap-2">
                                    {item.is_premium && (
                                        <div className="bg-amber-500/90 text-black text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                            <Star className="w-3 h-3 fill-current" /> Premium
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{item.title}</h3>

                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                                    <Video className="w-4 h-4" />
                                    <span>Video Highlight</span>
                                    <span>•</span>
                                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/50">
                                    <Link
                                        href={`/highlights/${item.id}`} // We haven't built edit page yet, but good to have link
                                        className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-medium transition"
                                    >
                                        <Edit className="w-4 h-4" /> Edit
                                    </Link>

                                    <form action={async () => {
                                        'use server';
                                        await deleteHighlight(item.id);
                                    }}>
                                        <button className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {highlights.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
                        <Video className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg">No highlights found</p>
                        <p className="text-sm">Click "Add Highlight" to create one</p>
                    </div>
                )}
            </div>
        </div>
    );
}
