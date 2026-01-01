"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  image_url: string | null;
  order_index: number;
  created_at: string;
}

interface WikiStats {
  characters: number;
  universe_items: number;
}

interface Character {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  view_count: number;
  verified: boolean;
}

interface WikiItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  view_count: number;
  verified: boolean;
}

export default function Home() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [wikiItems, setWikiItems] = useState<WikiItem[]>([]);
  const [wikiStats, setWikiStats] = useState<WikiStats>({ characters: 0, universe_items: 0 });
  const [loading, setLoading] = useState(true);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [wikiItemsLoading, setWikiItemsLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Audio ref for random sound effects
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Random sound effect at random intervals
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create audio element
    const audio = new Audio('/sounds/windows-startup.wav');
    audio.volume = 0.5; // Set volume to 50%
    audioRef.current = audio;

    let timeoutId: NodeJS.Timeout | null = null;

    const scheduleNextPlay = () => {
      // Random time between 5 seconds and 30 seconds
      const randomDelay = Math.random() * (30000 - 5000) + 5000;
      
      timeoutId = setTimeout(() => {
        audio.play().catch((err) => {
          // Ignore errors (user might have blocked autoplay)
          console.log('Audio play error (ignored):', err);
          // Schedule next play even if this one failed
          scheduleNextPlay();
        });
        
        // Schedule next play after current one finishes
        audio.onended = () => {
          scheduleNextPlay();
        };
      }, randomDelay);
    };

    // Start scheduling first play
    scheduleNextPlay();

    // Cleanup on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Check authentication status and handle magic link
  useEffect(() => {
    const checkSession = async () => {
      try {
        setAuthLoading(true);

        if (typeof window === 'undefined') {
          setAuthLoading(false);
          return;
        }

        const hash = window.location.hash.substring(1);
        const search = window.location.search.substring(1);

        let hashParams = new URLSearchParams(hash);
        let searchParams = new URLSearchParams(search);

        const redirectUrl = searchParams.get('q') || searchParams.get('url');
        if (redirectUrl) {
          try {
            const url = new URL(decodeURIComponent(redirectUrl));
            const token = url.searchParams.get('token');
            const type = url.searchParams.get('type');
            const redirectTo = url.searchParams.get('redirect_to');

            if (token && type === 'magiclink') {
              const verifyUrl = `${url.origin}${url.pathname}?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirectTo || 'https://yekuma.vercel.app/')}`;
              window.location.href = verifyUrl;
              return;
            }
          } catch (e) {
            console.error('Error parsing redirect URL:', e);
          }
        }

        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const errorParam = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

        if (errorParam) {
          console.error('Auth error:', errorParam, errorDescription);
          alert(`שגיאת התחברות: ${errorDescription || errorParam}`);
          window.history.replaceState(null, '', window.location.pathname);
          setAuthLoading(false);
          return;
        }

        if (accessToken || refreshToken) {
          try {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken || '',
              refresh_token: refreshToken || ''
            });

            if (sessionError) {
              console.error('Error setting session:', sessionError);
              alert('שגיאה בהתחברות: ' + sessionError.message);
            } else if (sessionData?.session) {
              setUser(sessionData.session.user);
              await fetchUserProfile(sessionData.session.user.id);
              alert('התחברת בהצלחה!');
            }
          } catch (err) {
            console.error('Error in setSession:', err);
            alert('שגיאה בלתי צפויה בהתחברות');
          }

          await new Promise(resolve => setTimeout(resolve, 1000));

          if (window.location.hash || window.location.search) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        }

        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Unexpected error checking session:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      if (session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, points')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setUserProfile(data);
      } else {
        const email = user?.email || '';
        const username = email.split('@')[0] || 'User';
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([{ id: userId, points: 0, username: username }])
          .select('id, username, points')
          .single();

        if (newProfile) {
          setUserProfile(newProfile);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  // Fetch chapters and wiki stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        let chaptersData, chaptersError;
        try {
          const result = await Promise.race([
            supabase
              .from('chapters')
              .select('id, title, description, video_url, image_url, order_index, created_at')
              .order('order_index', { ascending: true }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
            )
          ]) as any;

          if (result && result.error) {
            chaptersError = result.error;
            chaptersData = null;
          } else if (result && result.data !== undefined) {
            chaptersData = result.data;
            chaptersError = null;
          } else {
            chaptersError = new Error('Unexpected result format');
            chaptersData = null;
          }
        } catch (err: any) {
          chaptersError = err;
          chaptersData = null;
        }

        if (chaptersError) {
          setChapters([]);
        } else if (chaptersData && chaptersData.length > 0) {
          setChapters(chaptersData);
        } else {
          setChapters([]);
        }

        // Fetch wiki stats
        try {
          const [charactersRes, universeItemsRes] = await Promise.all([
            supabase.from('characters').select('id', { count: 'exact', head: true }),
            supabase.from('universe_items').select('id', { count: 'exact', head: true }),
          ]);

          setWikiStats({
            characters: charactersRes.count || 0,
            universe_items: universeItemsRes.count || 0,
          });
        } catch (err) {
          console.warn('Wiki stats not available:', err);
        }
      } catch (err) {
        console.error('Unexpected error fetching chapters:', err);
        setChapters([]);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    };

    fetchData();
  }, []);

  // Fetch characters
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setCharactersLoading(true);

        let data, error;
        try {
          const result = await Promise.race([
            supabase
              .from('characters')
              .select('id, title, description, image_url, view_count, verified')
              .order('title', { ascending: true })
              .limit(12),
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
          setCharacters([]);
        } else {
          setCharacters(data || []);
        }
      } catch (err) {
        console.error('Unexpected error fetching characters:', err);
        setCharacters([]);
      } finally {
        setCharactersLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  // Fetch wiki items
  useEffect(() => {
    const fetchWikiItems = async () => {
      try {
        setWikiItemsLoading(true);

        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
          );

          const result = await Promise.race([
            supabase.from('universe_items').select('id, title, description, image_url, view_count, verified').order('created_at', { ascending: false }).limit(60),
            timeoutPromise
          ]) as any;

          if (result.error) {
            setWikiItems([]);
          } else {
            const shuffled = (result.data || []).sort(() => Math.random() - 0.5);
            setWikiItems(shuffled);
          }
        } catch (err: any) {
          setWikiItems([]);
        }
      } catch (err) {
        setWikiItems([]);
      } finally {
        setWikiItemsLoading(false);
      }
    };

    fetchWikiItems();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
        return;
      }
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };


  return (
    <div className="min-h-screen bg-[#120e0b] text-white overflow-hidden relative pb-24">
      <div className="relative z-10">
        {/* Top App Bar */}
        <div className="app-bar flex items-center justify-between">
          <button className="btn-icon">
            <span className="material-symbols-outlined">menu</span>
          </button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-extrabold tracking-tight uppercase">
              <span className="text-[#ec6d13]">יקו</span>מות
            </h1>
            <div className="h-0.5 w-full bg-gradient-to-l from-transparent via-[#ec6d13] to-transparent opacity-50" />
          </div>

          {user ? (
            <div className="relative group">
              <button className="btn-icon">
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </button>
              <div className="absolute left-0 top-12 bg-[#1e1a17] border border-white/10 rounded-lg p-2 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="px-3 py-2 text-sm border-b border-white/10">
                  <div className="text-white/60 text-xs mb-1">מחובר כ:</div>
                  <div className="text-white truncate">{user.email}</div>
                  {userProfile && (
                    <div className="text-[#ec6d13] text-sm mt-1 font-bold">{userProfile.points || 0} נקודות</div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-right px-3 py-2 text-sm rounded mt-1 hover:bg-white/5 text-[#ef4444] transition-colors"
                >
                  התנתק
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="btn-icon">
              <span className="material-symbols-outlined">person</span>
            </Link>
          )}
        </div>

        {/* Chapters Grid Section */}
        <section className="mb-6 px-4">
          <div className="flex items-center justify-between pb-3">
            <h3 className="section-title">
              <span className="section-dot" />
              כל הפרקים
            </h3>
          </div>

          {loading && initialLoad ? (
            <div className="flex justify-center py-12">
              <div className="spinner" />
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <p>אין פרקים זמינים</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {chapters.map((chapter, index) => (
                <Link
                  key={chapter.id}
                  href={`/chapter/${chapter.id}`}
                  className="flex flex-col gap-2 group cursor-pointer"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-[#1e1a17]">
                    {chapter.image_url ? (
                      <Image
                        src={chapter.image_url}
                        alt={chapter.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[32px] text-[#ec6d13]/30">movie</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  </div>
                  <div className="flex flex-col px-1">
                    <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider">
                      פרק {String(index + 1).padStart(2, '0')}
                    </span>
                    <h4 className="text-white text-sm font-semibold line-clamp-2">{chapter.title}</h4>
                    {chapter.description && (
                      <p className="text-white/60 text-xs line-clamp-2 mt-1">{chapter.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Characters Database Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between px-4 pb-3">
            <h3 className="section-title">
              <span className="material-symbols-outlined text-[#26c6da] text-lg">database</span>
              מסד נתונים
            </h3>
            <Link href="/characters" className="text-xs text-[#ec6d13] font-medium hover:text-orange-400">
              הצג הכל
            </Link>
          </div>

          {charactersLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : characters.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <p>אין דמויות עדיין</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto no-scrollbar px-4 gap-4">
              {characters.slice(0, 6).map((character, index) => (
                <Link
                  key={character.id}
                  href={`/characters/${character.id}`}
                  className="flex flex-col items-center gap-2 min-w-[80px]"
                >
                  <div className={`avatar-circle ${index === 0 ? 'bg-gradient-to-tr from-[#ec6d13] to-transparent' : 'border border-white/15'}`}>
                    <div className="avatar-circle-inner">
                      {character.image_url ? (
                        <Image
                          src={character.image_url}
                          alt={character.title}
                          width={64}
                          height={64}
                          className={`w-full h-full object-cover ${index !== 0 ? 'grayscale opacity-80' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#1e1a17]">
                          <span className="material-symbols-outlined text-[24px] text-[#ec6d13]/50">person</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium text-center ${index === 0 ? 'text-white' : 'text-white/70'}`}>
                    {character.title}
                  </span>
                </Link>
              ))}
              
              {/* Add New Character */}
              <Link
                href="/characters/new"
                className="flex flex-col items-center gap-2 min-w-[80px]"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 border border-dashed border-white/30 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <span className="text-xs text-white/50 font-medium text-center">הוסף חדש</span>
              </Link>
            </div>
          )}
        </section>

        {/* Stats Dashboard */}
        <section className="px-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#26c6da] text-sm">verified</span>
                <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider">מקורות</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-white tabular-nums">
                  {wikiStats.characters + wikiStats.universe_items}
                </span>
                <span className="text-[10px] text-green-500 font-mono mb-1" dir="ltr">▲ 12%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#ec6d13] text-sm">edit_note</span>
                <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider">עריכות יומיות</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-white tabular-nums">{wikiStats.characters}</span>
                <span className="text-[10px] text-white/40 font-mono mb-1">חדש</span>
              </div>
            </div>

            <div className="col-span-2 stat-card bg-gradient-to-l from-[#1e1a17] to-[#1e1a17]/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider block mb-1">דירוג קהילה</span>
                  <span className="text-sm text-white font-medium">רמה 4: כורה מידע</span>
                </div>
                <div className="h-10 w-24 relative" dir="ltr">
                  <div className="absolute inset-0 flex items-end justify-between gap-1 opacity-50">
                    <div className="w-1 bg-[#26c6da] h-[40%]" />
                    <div className="w-1 bg-[#26c6da] h-[60%]" />
                    <div className="w-1 bg-[#26c6da] h-[30%]" />
                    <div className="w-1 bg-[#26c6da] h-[80%]" />
                    <div className="w-1 bg-[#ec6d13] h-[100%] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wiki Items Grid */}
        <section className="mb-6 px-4">
          <div className="flex items-center justify-between pb-3">
            <h3 className="section-title">
              <span className="material-symbols-outlined text-[#ec6d13] text-lg">public</span>
              היקום
            </h3>
          </div>

          {wikiItemsLoading ? (
            <div className="flex justify-center py-8">
              <div className="spinner" />
            </div>
          ) : wikiItems.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <p>אין פריטים עדיין</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {wikiItems.slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href={`/universe/${item.id}`}
                  className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-[#1e1a17] group"
                >
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1e1a17]">
                      <span className="material-symbols-outlined text-[32px] text-[#ec6d13] opacity-30">
                        auto_awesome
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          <div className="flex items-center justify-around pb-2">
            <button className="bottom-nav-item active relative">
              <span className="material-symbols-outlined">home</span>
              <span className="text-[10px] font-bold">בית</span>
            </button>
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bottom-nav-item"
            >
              <span className="material-symbols-outlined">movie</span>
              <span className="text-[10px] font-medium">פרקים</span>
            </button>
            <Link href="/characters" className="bottom-nav-item">
              <span className="material-symbols-outlined">menu_book</span>
              <span className="text-[10px] font-medium">ויקי</span>
            </Link>
            <Link href="/login" className="bottom-nav-item">
              <span className="material-symbols-outlined">person</span>
              <span className="text-[10px] font-medium">פרופיל</span>
            </Link>
          </div>
          <div className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}
