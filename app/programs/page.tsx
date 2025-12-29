"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Program {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  view_count: number;
  verified: boolean;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
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
    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('programs')
          .select('id, title, description, image_url, view_count, verified')
          .order('title', { ascending: true });

        if (error) {
          console.error('Error fetching programs:', error);
          setPrograms([]);
        } else {
          setPrograms(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
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
              תכניות
            </h1>
            <p className="mt-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>כל התכניות ביקום</p>
          </div>
          {user && (
            <Link
              href="/programs/new"
              className="control-panel-btn"
            >
              + הוסף תכנית חדשה
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-xl mb-4">אין תכניות עדיין</p>
            {user && (
              <Link href="/programs/new" className="text-blue-400 hover:text-blue-300 underline">
                הוסף את התכנית הראשונה
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {programs.map((program) => (
              <Link
                key={program.id}
                href={`/programs/${program.id}`}
                className="group relative wireframe-border overflow-hidden glitch-hover"
                style={{ background: 'transparent' }}
                data-title={program.title}
              >
                <div className="relative aspect-square bg-black">
                  {program.image_url ? (
                    <Image
                      src={program.image_url}
                      alt={program.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-16 h-16" style={{ color: '#008C9E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1 transition-colors glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                    {program.title}
                  </h3>
                  {program.description && (
                    <p className="text-sm line-clamp-2 mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)', opacity: 0.7 }}>
                      {program.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}>
                    <span>{program.view_count || 0} צפיות</span>
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
