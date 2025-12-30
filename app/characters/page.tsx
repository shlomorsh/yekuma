"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Character {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  view_count: number;
  verified: boolean;
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [initialLoad, setInitialLoad] = useState(true);

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
    const fetchCharacters = async () => {
      try {
        console.log('[Characters] Starting to fetch characters...');
        setLoading(true);
        const startTime = Date.now();
        
        let data, error;
        try {
          console.log('[Characters] Making Supabase request...');
          const result = await Promise.race([
            supabase
              .from('characters')
              .select('id, title, description, image_url, view_count, verified')
              .order('title', { ascending: true }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
            )
          ]) as any;
          
          if (result.error) {
            error = result.error;
            data = null;
          } else {
            data = result.data;
            error = null;
          }
          
          console.log('[Characters] Fetch completed in', Date.now() - startTime, 'ms');
        } catch (err: any) {
          console.error('[Characters] Fetch exception:', err);
          error = err;
          data = null;
        }

        console.log('[Characters] Fetch result:', { 
          hasData: !!data, 
          dataLength: data?.length, 
          hasError: !!error,
          error: error 
        });

        if (error) {
          console.error('[Characters] Error fetching characters:', error);
          setCharacters([]);
        } else {
          console.log('[Characters] Setting characters:', data?.length || 0);
          setCharacters(data || []);
        }
      } catch (err) {
        console.error('[Characters] Unexpected error:', err);
        setCharacters([]);
      } finally {
        console.log('[Characters] Finished fetching');
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchCharacters();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
              ← חזרה לדף הבית
            </Link>
            <h1 className="text-5xl font-bold glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
              דמויות
            </h1>
            <p className="mt-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>גלה את כל הדמויות ביקום</p>
          </div>
          {user && (
            <Link
              href="/characters/new"
              className="control-panel-btn"
            >
              + הוסף דמות חדשה
            </Link>
          )}
        </div>

        {/* Characters Grid */}
        {loading && initialLoad ? (
          <div className="text-center py-20">
            <div className="spinner spinner-large mx-auto"></div>
          </div>
        ) : characters.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-zinc-400 text-xl mb-4">אין דמויות עדיין</p>
            {user && (
              <Link
                href="/characters/new"
                className="btn-link"
              >
                הוסף את הדמות הראשונה
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {characters.map((character) => (
              <div key={character.id} className="character-sandwich relative">
                {/* Background Layer */}
                <div className="background-layer absolute inset-0 bg-black wireframe-border" />
                
                {/* Wireframe Logo Layer - Yekumot wireframe */}
                <div className="wireframe-layer absolute inset-0 flex items-center justify-center opacity-30" style={{ zIndex: 2 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100" style={{ mixBlendMode: 'screen' }}>
                    <rect x="20" y="20" width="60" height="60" fill="none" stroke="#FFFFFF" strokeWidth="1" />
                    <line x1="30" y1="50" x2="70" y2="50" stroke="#FFFFFF" strokeWidth="1" />
                    <line x1="50" y1="30" x2="50" y2="70" stroke="#FFFFFF" strokeWidth="1" />
                  </svg>
                </div>
                
                {/* Character Layer */}
                <Link
                  href={`/characters/${character.id}`}
                  className="character-layer relative block wireframe-border overflow-hidden glitch-hover"
                  style={{ background: 'transparent' }}
                  data-title={character.title}
                >
                  <div className="relative aspect-square bg-black">
                    {character.image_url ? (
                      <Image
                        src={character.image_url}
                        alt={character.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-16 h-16" style={{ color: '#008C9E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    {character.verified && (
                      <div className="absolute top-2 left-2 px-2 py-1 text-xs wireframe-border flex items-center gap-1" style={{ color: '#FF6B00', fontFamily: 'var(--font-mono)', background: '#000000' }}>
                        <span>⭐</span>
                        <span>מאומת</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Text Layer */}
                  <div className="text-layer p-4">
                    <h3 className="text-lg font-bold mb-1 transition-colors glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                      {character.title}
                    </h3>
                    {character.description && (
                      <p className="text-sm line-clamp-2 mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)', opacity: 0.7 }}>
                        {character.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}>
                      <span>{character.view_count || 0} צפיות</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

