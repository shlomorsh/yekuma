"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  view_count: number;
  verified: boolean;
}

export default function AdvertisementsPage() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
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
    const fetchAdvertisements = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('advertisements')
          .select('id, title, description, image_url, view_count, verified')
          .order('title', { ascending: true });

        if (error) {
          console.error('Error fetching advertisements:', error);
          setAdvertisements([]);
        } else {
          setAdvertisements(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setAdvertisements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisements();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-pink-500/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-pink-400 hover:text-pink-300 mb-4 inline-block">
              ← חזרה לדף הבית
            </Link>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
              פרסומות
            </h1>
            <p className="text-zinc-400 mt-2">פרסומות מהיקום</p>
          </div>
          {user && (
            <Link
              href="/advertisements/new"
              className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              + הוסף פרסומת חדשה
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
          </div>
        ) : advertisements.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-xl mb-4">אין פרסומות עדיין</p>
            {user && (
              <Link href="/advertisements/new" className="text-pink-400 hover:text-pink-300 underline">
                הוסף את הפרסומת הראשונה
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {advertisements.map((ad) => (
              <Link
                key={ad.id}
                href={`/advertisements/${ad.id}`}
                className="group bg-zinc-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-800 hover:border-pink-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/20 hover:scale-105"
              >
                <div className="relative aspect-square bg-gradient-to-br from-zinc-900 to-black">
                  {ad.image_url ? (
                    <Image src={ad.image_url} alt={ad.title} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-pink-500/20 blur-2xl" />
                      <svg className="w-16 h-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.533 9.5-3.5C19.532 4.5 22 8.5 22 13c0 1.76-.743 4.5-5.5 4.5s-7.5-2.5-7.5-2.5z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {ad.verified && (
                    <div className="absolute top-2 left-2 bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1">
                      <span>⭐</span>
                      <span>מאומת</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1 text-white group-hover:text-pink-400 transition-colors">{ad.title}</h3>
                  {ad.description && <p className="text-zinc-400 text-sm line-clamp-2 mb-2">{ad.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{ad.view_count || 0} צפיות</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

