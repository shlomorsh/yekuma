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
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              ← חזרה לדף הבית
            </Link>
            <h1 className="text-5xl font-bold glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
              פרסומות
            </h1>
            <p className="mt-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>פרסומות מהיקום</p>
          </div>
          {user && (
            <Link
              href="/advertisements/new"
              className="control-panel-btn"
            >
              + הוסף פרסומת חדשה
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : advertisements.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-xl mb-4">אין פרסומות עדיין</p>
            {user && (
              <Link href="/advertisements/new" className="text-blue-400 hover:text-blue-300 underline">
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
                className="group relative wireframe-border overflow-hidden glitch-hover"
                style={{ background: 'transparent' }}
                data-title={ad.title}
              >
                <div className="relative aspect-square bg-black">
                  {ad.image_url ? (
                    <Image
                      src={ad.image_url}
                      alt={ad.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-16 h-16" style={{ color: '#008C9E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.533 9.5-3.5C19.532 4.5 22 8.5 22 13c0 1.76-.743 4.5-5.5 4.5s-7.5-2.5-7.5-2.5z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1 transition-colors glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                    {ad.title}
                  </h3>
                  {ad.description && (
                    <p className="text-sm line-clamp-2 mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)', opacity: 0.7 }}>
                      {ad.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}>
                    <span>{ad.view_count || 0} צפיות</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
