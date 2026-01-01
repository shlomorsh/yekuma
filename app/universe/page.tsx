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
    view_count: number;
    verified: boolean;
}

export default function UniversePage() {
    const [items, setItems] = useState<UniverseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

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
                const { data, error } = await supabase
                    .from('universe_items')
                    .select('id, title, description, image_url, view_count, verified')
                    .order('created_at', { ascending: false });

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
    }, []);

    return (
        <div className="min-h-screen bg-[#120e0b] text-white pb-24">
            {/* Header */}
            <div className="app-bar flex items-center justify-between">
                <Link href="/" className="btn-icon">
                    <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                
                <div className="flex flex-col items-center">
                    <h1 className="text-2xl font-extrabold tracking-tight uppercase">
                        <span className="text-[#ec6d13]">יקו</span>מות
                    </h1>
                    <div className="h-0.5 w-full bg-gradient-to-l from-transparent via-[#ec6d13] to-transparent opacity-50" />
                </div>

                {user && (
                    <Link href="/universe/new" className="btn-icon">
                        <span className="material-symbols-outlined">add</span>
                    </Link>
                )}
            </div>

            {/* Page Title */}
            <div className="px-4 py-6">
                <h2 className="text-3xl font-bold mb-2">היקום</h2>
                <p className="text-white/60 text-sm">כל הפריטים מהיקום</p>
            </div>

            {/* Items Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="spinner spinner-large" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-white/40 text-xl mb-4">אין פריטים עדיין</p>
                    {user && (
                        <Link href="/universe/new" className="btn-primary">
                            הוסף את הפריט הראשון
                        </Link>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-8">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={`/universe/${item.id}`}
                            className="character-card group"
                        >
                            <div className="relative aspect-square mb-3">
                                {item.image_url ? (
                                    <Image
                                        src={item.image_url}
                                        alt={item.title}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-[#1e1a17]">
                                        <span className="material-symbols-outlined text-[48px] text-[#ec6d13]/30">auto_awesome</span>
                                    </div>
                                )}
                                {item.verified && (
                                    <div className="absolute top-2 right-2">
                                        <span className="material-symbols-outlined text-green-500 text-base">verified</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="px-1">
                                <h3 className="text-sm font-bold truncate mb-1">
                                    {item.title}
                                </h3>
                                {item.description && (
                                    <p className="text-xs text-white/60 line-clamp-2 mb-2">
                                        {item.description}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 text-[10px] text-white/40">
                                    <span className="material-symbols-outlined text-[12px]">visibility</span>
                                    <span>{item.view_count || 0}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="bottom-nav">
                <div className="flex items-center justify-around pb-2">
                    <Link href="/" className="bottom-nav-item">
                        <span className="material-symbols-outlined">home</span>
                        <span className="text-[10px] font-medium">בית</span>
                    </Link>
                    <Link href="/universe" className="bottom-nav-item active relative">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <span className="text-[10px] font-bold">יקום</span>
                    </Link>
                    <Link href={user ? "#" : "/login"} className="bottom-nav-item">
                        <span className="material-symbols-outlined">person</span>
                        <span className="text-[10px] font-medium">פרופיל</span>
                    </Link>
                </div>
                <div className="h-4 w-full" />
            </div>
        </div>
    );
}
