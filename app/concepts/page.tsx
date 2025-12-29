"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Concept {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  view_count: number;
  verified: boolean;
}

export default function ConceptsPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
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
    const fetchConcepts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('concepts')
          .select('id, title, description, image_url, view_count, verified')
          .order('title', { ascending: true });

        if (error) {
          console.error('Error fetching concepts:', error);
          setConcepts([]);
        } else {
          setConcepts(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setConcepts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConcepts();
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
              מושגים
            </h1>
            <p className="mt-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>מושגים מרכזיים</p>
          </div>
          {user && (
            <Link
              href="/concepts/new"
              className="control-panel-btn"
            >
              + הוסף מושג חדש
            </Link>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : concepts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-xl mb-4">אין מושגים עדיין</p>
            {user && (
              <Link href="/concepts/new" className="text-blue-400 hover:text-blue-300 underline">
                הוסף את המושג הראשון
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {concepts.map((concept) => (
              <Link
                key={concept.id}
                href={`/concepts/${concept.id}`}
                className="group relative wireframe-border overflow-hidden glitch-hover"
                style={{ background: 'transparent' }}
                data-title={concept.title}
              >
                <div className="relative aspect-square bg-black">
                  {concept.image_url ? (
                    <Image
                      src={concept.image_url}
                      alt={concept.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-16 h-16" style={{ color: '#008C9E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold mb-1 transition-colors glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                    {concept.title}
                  </h3>
                  {concept.description && (
                    <p className="text-sm line-clamp-2 mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)', opacity: 0.7 }}>
                      {concept.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}>
                    <span>{concept.view_count || 0} צפיות</span>
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
