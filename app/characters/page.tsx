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
        setLoading(true);
        
        let data, error;
        try {
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
        } catch (err: any) {
          error = err;
          data = null;
        }

        if (error) {
          console.error('Error fetching characters:', error);
          setCharacters([]);
        } else {
          setCharacters(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setCharacters([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchCharacters();
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
            <span className="text-[#FFFFFF]">יקו</span>מות
          </h1>
          <div className="h-0.5 w-full bg-gradient-to-l from-transparent via-[#FFFFFF] to-transparent opacity-50" />
        </div>

        {user && (
          <Link href="/characters/new" className="btn-icon">
            <span className="material-symbols-outlined">add</span>
          </Link>
        )}
      </div>

      {/* Page Title */}
      <div className="px-4 py-6">
        <h2 className="text-3xl font-bold mb-2">דמויות</h2>
        <p className="text-white/60 text-sm">גלה את כל הדמויות ביקום</p>
      </div>

      {/* Characters Grid */}
      {loading && initialLoad ? (
        <div className="flex justify-center py-20">
          <div className="spinner spinner-large" />
        </div>
      ) : characters.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-xl mb-4">אין דמויות עדיין</p>
          {user && (
            <Link href="/characters/new" className="btn-primary">
              הוסף את הדמות הראשונה
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-8">
          {characters.map((character) => (
            <Link
              key={character.id}
              href={`/characters/${character.id}`}
              className="character-card group"
            >
              <div className="relative aspect-square mb-3">
                {character.image_url ? (
                  <Image
                    src={character.image_url}
                    alt={character.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1e1a17]">
                    <span className="material-symbols-outlined text-[48px] text-[#FFFFFF]/30">person</span>
                  </div>
                )}
                {character.verified && (
                  <div className="absolute top-2 right-2">
                    <span className="material-symbols-outlined text-green-500 text-base">verified</span>
                  </div>
                )}
              </div>
              
              <div className="px-1">
                <h3 className="text-sm font-bold truncate mb-1">
                  {character.title}
                </h3>
                {character.description && (
                  <p className="text-xs text-white/60 line-clamp-2 mb-2">
                    {character.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-white/40">
                  <span className="material-symbols-outlined text-[12px]">visibility</span>
                  <span>{character.view_count || 0}</span>
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
          <button className="bottom-nav-item active relative">
            <span className="material-symbols-outlined">menu_book</span>
            <span className="text-[10px] font-bold">ויקי</span>
          </button>
          <Link href="/login" className="bottom-nav-item">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-medium">פרופיל</span>
          </Link>
        </div>
        <div className="h-4 w-full" />
      </div>
    </div>
  );
}
