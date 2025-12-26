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
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-500/20"
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
            <Link href="/" className="text-purple-400 hover:text-purple-300 mb-4 inline-block">
              ← חזרה לדף הבית
            </Link>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              תכניות
            </h1>
            <p className="text-zinc-400 mt-2">כל התכניות ביקום</p>
          </div>
          {user && (
            <Link
              href="/programs/new"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              + הוסף תכנית חדשה
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-xl mb-4">אין תכניות עדיין</p>
            {user && (
              <Link href="/programs/new" className="text-purple-400 hover:text-purple-300 underline">
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
                className="group bg-zinc-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105"
              >
                <div className="relative aspect-square bg-gradient-to-br from-zinc-900 to-black">
                  {program.image_url ? (
                    <Image src={program.image_url} alt={program.title} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-purple-500/20 blur-2xl" />
                      <svg className="w-16 h-16 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  {program.verified && (
                    <div className="absolute top-2 left-2 bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1">
                      <span>⭐</span>
                      <span>מאומת</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1 text-white group-hover:text-purple-400 transition-colors">{program.title}</h3>
                  {program.description && <p className="text-zinc-400 text-sm line-clamp-2 mb-2">{program.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span>{program.view_count || 0} צפיות</span>
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

