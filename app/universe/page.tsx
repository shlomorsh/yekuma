"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface UniverseItem {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    item_type: 'program' | 'advertisement' | 'concept';
    view_count: number;
    verified: boolean;
}

export default function UniversePage() {
    const [items, setItems] = useState<UniverseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            }
        };
        checkSession();
    }, []);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                setLoading(true);
                let query = supabase
                    .from('universe_items')
                    .select('id, title, description, image_url, item_type, view_count, verified')
                    .order('created_at', { ascending: false });

                if (filterType !== 'all') {
                    query = query.eq('item_type', filterType);
                }

                const { data, error } = await query;

                if (error) {
                    console.error('Error fetching universe items:', error);
                    setItems([]);
                } else {
                    setItems(data || []);
                }
            } catch (err) {
                console.error('Unexpected error:', err);
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [filterType]);

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'program':
                return 'תכנית';
            case 'advertisement':
                return 'פרסומת';
            case 'concept':
                return 'מושג';
            default:
                return type;
        }
    };

    const getTypeColors = (type: string) => {
        switch (type) {
            case 'program':
                return '#008C9E';
            case 'advertisement':
                return '#FF6B00';
            case 'concept':
                return '#D62828';
            default:
                return '#FFFFFF';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'program':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                );
            case 'advertisement':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.533 9.5-3.5C19.532 4.5 22 8.5 22 13c0 1.76-.743 4.5-5.5 4.5s-7.5-2.5-7.5-2.5z" />
                );
            case 'concept':
                return (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
            <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
                <div className="mb-8">
                    <Link href="/" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                        ← חזרה לדף הבית
                    </Link>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-5xl font-bold glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                                היקום
                            </h1>
                            <p className="mt-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>כל התכניות, הפרסומות והמושגים מהיקום</p>
                        </div>
                        {user && (
                            <Link
                                href="/universe/new"
                                className="control-panel-btn"
                            >
                                + הוסף פריט חדש
                            </Link>
                        )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-4 py-2 wireframe-border transition-colors ${filterType === 'all' ? 'bg-white/10' : ''}`}
                            style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}
                        >
                            הכל ({items.length})
                        </button>
                        <button
                            onClick={() => setFilterType('program')}
                            className={`px-4 py-2 wireframe-border transition-colors ${filterType === 'program' ? 'bg-white/10' : ''}`}
                            style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}
                        >
                            תכניות
                        </button>
                        <button
                            onClick={() => setFilterType('advertisement')}
                            className={`px-4 py-2 wireframe-border transition-colors ${filterType === 'advertisement' ? 'bg-white/10' : ''}`}
                            style={{ color: '#FF6B00', fontFamily: 'var(--font-mono)' }}
                        >
                            פרסומות
                        </button>
                        <button
                            onClick={() => setFilterType('concept')}
                            className={`px-4 py-2 wireframe-border transition-colors ${filterType === 'concept' ? 'bg-white/10' : ''}`}
                            style={{ color: '#D62828', fontFamily: 'var(--font-mono)' }}
                        >
                            מושגים
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-zinc-400 text-xl mb-4">אין פריטים עדיין</p>
                        {user && (
                            <Link href="/universe/new" className="text-blue-400 hover:text-blue-300 underline">
                                הוסף את הפריט הראשון
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {items.map((item) => {
                            const typeColor = getTypeColors(item.item_type);
                            return (
                                <Link
                                    key={item.id}
                                    href={`/universe/${item.id}`}
                                    className="group relative wireframe-border overflow-hidden glitch-hover"
                                    style={{ background: 'transparent' }}
                                    data-title={item.title}
                                >
                                    <div className="relative aspect-square bg-black">
                                        {item.image_url ? (
                                            <Image
                                                src={item.image_url}
                                                alt={item.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <svg className="w-16 h-16" style={{ color: typeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    {getTypeIcon(item.item_type)}
                                                </svg>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 px-2 py-1 text-xs wireframe-border" style={{ color: typeColor, fontFamily: 'var(--font-mono)', background: '#000000' }}>
                                            {getTypeLabel(item.item_type)}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-lg font-bold mb-1 transition-colors glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                                            {item.title}
                                        </h3>
                                        {item.description && (
                                            <p className="text-sm line-clamp-2 mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)', opacity: 0.7 }}>
                                                {item.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 text-xs" style={{ color: typeColor, fontFamily: 'var(--font-mono)' }}>
                                            <span>{item.view_count || 0} צפיות</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
