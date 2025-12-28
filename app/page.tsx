"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  programs: number;
  advertisements: number;
  concepts: number;
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
  type: 'program' | 'advertisement' | 'concept';
}

export default function Home() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [wikiItems, setWikiItems] = useState<WikiItem[]>([]);
  const [wikiStats, setWikiStats] = useState<WikiStats>({ characters: 0, programs: 0, advertisements: 0, concepts: 0 });
  const [loading, setLoading] = useState(true);
  const [charactersLoading, setCharactersLoading] = useState(true);
  const [wikiItemsLoading, setWikiItemsLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse for parallax effects - throttled for performance
  useEffect(() => {
    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          setMousePosition({ x: e.clientX, y: e.clientY });
          rafId = null;
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  // Check authentication status and handle magic link
  useEffect(() => {
    const checkSession = async () => {
      try {
        setAuthLoading(true);
        
        // Handle magic link callback from URL hash or query params
        // Check both hash (direct) and query params (Google redirect)
        if (typeof window === 'undefined') {
          setAuthLoading(false);
          return;
        }
        
        const hash = window.location.hash.substring(1);
        const search = window.location.search.substring(1);
        
        // Try to get tokens from hash first, then from query params
        let hashParams = new URLSearchParams(hash);
        let searchParams = new URLSearchParams(search);
        
        // Check if there's a redirect URL in query (from Google)
        const redirectUrl = searchParams.get('q') || searchParams.get('url');
        if (redirectUrl) {
          // Extract tokens from the redirected URL
          try {
            const url = new URL(decodeURIComponent(redirectUrl));
            const token = url.searchParams.get('token');
            const type = url.searchParams.get('type');
            const redirectTo = url.searchParams.get('redirect_to');
            
            if (token && type === 'magiclink') {
              // This is a magic link - redirect to Supabase verify endpoint
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
        
        // If there's an error in the URL, show it
        if (errorParam) {
          console.error('Auth error:', errorParam, errorDescription);
          alert(`שגיאת התחברות: ${errorDescription || errorParam}`);
          // Clear the hash/query
          window.history.replaceState(null, '', window.location.pathname);
          setAuthLoading(false);
          return;
        }
        
        // If we have tokens in the URL, set the session
        if (accessToken || refreshToken) {
          console.log('Magic link detected, processing...');
          
          try {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken || '',
              refresh_token: refreshToken || ''
            });
            
            if (sessionError) {
              console.error('Error setting session:', sessionError);
              alert('שגיאה בהתחברות: ' + sessionError.message);
            } else if (sessionData?.session) {
              console.log('Session set successfully');
              setUser(sessionData.session.user);
              await fetchUserProfile(sessionData.session.user.id);
              // Show success message
              alert('התחברת בהצלחה!');
            }
          } catch (err) {
            console.error('Error in setSession:', err);
            alert('שגיאה בלתי צפויה בהתחברות');
          }
          
          // Wait a moment for Supabase to process
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Clear URL hash/query after processing
          if (window.location.hash || window.location.search) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
        
        // Get the current session
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
      console.log('Auth state changed:', event, session?.user?.email);
      
      // Clear URL hash if present
      if (typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      
      if (session?.user) {
        console.log('Session established for:', session.user.email);
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
        console.log('[Home] Starting to fetch data...');
        setLoading(true);
        // Fetch chapters directly
        console.log('[Home] Fetching chapters from Supabase...');
        const startTime = Date.now();
        
        let chaptersData, chaptersError;
        try {
          console.log('[Home] Making Supabase request...');
          const result = await Promise.race([
            supabase
              .from('chapters')
              .select('id, title, description, video_url, image_url, order_index, created_at')
              .order('order_index', { ascending: true }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
            )
          ]) as any;
          
          if (result.error) {
            chaptersError = result.error;
            chaptersData = null;
          } else {
            chaptersData = result.data;
            chaptersError = null;
          }
          
          const elapsed = Date.now() - startTime;
          console.log('[Home] Chapters fetch completed in', elapsed, 'ms', {
            hasData: !!chaptersData,
            dataLength: chaptersData?.length,
            hasError: !!chaptersError,
            error: chaptersError
          });
        } catch (err: any) {
          console.error('[Home] Chapters fetch exception:', err);
          chaptersError = err;
          chaptersData = null;
        }

        console.log('[Home] Chapters fetch result:', { 
          hasData: !!chaptersData, 
          dataLength: chaptersData?.length, 
          hasError: !!chaptersError,
          error: chaptersError 
        });

        if (chaptersError) {
          console.error('[Home] Error fetching chapters:', chaptersError);
          setChapters([]);
        } else if (chaptersData && chaptersData.length > 0) {
          console.log('[Home] Setting chapters:', chaptersData.length);
          setChapters(chaptersData);
        } else {
          console.log('[Home] No chapters found');
          setChapters([]);
        }

        // Fetch wiki stats (with error handling)
        try {
          console.log('[Home] Fetching wiki stats...');
          const [charactersRes, programsRes, adsRes, conceptsRes] = await Promise.all([
            supabase.from('characters').select('id', { count: 'exact', head: true }),
            supabase.from('programs').select('id', { count: 'exact', head: true }),
            supabase.from('advertisements').select('id', { count: 'exact', head: true }),
            supabase.from('concepts').select('id', { count: 'exact', head: true }),
          ]);

          console.log('[Home] Wiki stats:', {
            characters: charactersRes.count,
            programs: programsRes.count,
            advertisements: adsRes.count,
            concepts: conceptsRes.count
          });

          setWikiStats({
            characters: charactersRes.count || 0,
            programs: programsRes.count || 0,
            advertisements: adsRes.count || 0,
            concepts: conceptsRes.count || 0,
          });
        } catch (err) {
          console.warn('[Home] Wiki stats not available:', err);
        }
      } catch (err) {
        console.error('[Home] Unexpected error fetching chapters:', err);
        setChapters([]);
    } finally {
        console.log('[Home] Finished fetching, setting loading to false');
        setLoading(false);
        setInitialLoad(false);
      }
    };

    // Fetch immediately - no delay needed
    console.log('[Home] useEffect triggered, starting fetch...');
    fetchData();
  }, []);

  // Fetch characters
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        console.log('[Home] Fetching characters...');
        setCharactersLoading(true);
        const startTime = Date.now();
        
        let data, error;
        try {
          console.log('[Home] Making characters Supabase request...');
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
          
          console.log('[Home] Characters fetch completed in', Date.now() - startTime, 'ms');
        } catch (err: any) {
          console.error('[Home] Characters fetch exception:', err);
          error = err;
          data = null;
        }

        console.log('[Home] Characters fetch result:', { 
          hasData: !!data, 
          dataLength: data?.length, 
          hasError: !!error,
          error: error 
        });

        if (error) {
          console.error('[Home] Error fetching characters:', error);
          setCharacters([]);
        } else {
          console.log('[Home] Setting characters:', data?.length || 0);
          setCharacters(data || []);
        }
      } catch (err) {
        console.error('[Home] Unexpected error fetching characters:', err);
        setCharacters([]);
      } finally {
        setCharactersLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  // Fetch and mix all wiki items
  useEffect(() => {
    const fetchWikiItems = async () => {
      try {
        console.log('[Home] Fetching wiki items...');
        setWikiItemsLoading(true);
        
        // Fetch all items from the three tables - limit for performance
        const startTime = Date.now();
        let programsRes, adsRes, conceptsRes;
        try {
          console.log('[Home] Making wiki items Supabase requests...');
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
          );
          
          const results = await Promise.race([
            Promise.all([
              supabase.from('programs').select('id, title, description, image_url, view_count, verified').order('created_at', { ascending: false }).limit(20),
              supabase.from('advertisements').select('id, title, description, image_url, view_count, verified').order('created_at', { ascending: false }).limit(20),
              supabase.from('concepts').select('id, title, description, image_url, view_count, verified').order('created_at', { ascending: false }).limit(20),
            ]),
            timeoutPromise
          ]) as any;
          
          [programsRes, adsRes, conceptsRes] = results;
          console.log('[Home] Wiki items fetch completed in', Date.now() - startTime, 'ms');
        } catch (err: any) {
          console.error('[Home] Wiki items fetch exception:', err);
          programsRes = { data: null, error: err };
          adsRes = { data: null, error: err };
          conceptsRes = { data: null, error: err };
        }

        console.log('[Home] Wiki items fetch result:', {
          programs: programsRes.data?.length || 0,
          advertisements: adsRes.data?.length || 0,
          concepts: conceptsRes.data?.length || 0,
          programsError: programsRes.error,
          adsError: adsRes.error,
          conceptsError: conceptsRes.error
        });

        const allItems: WikiItem[] = [];

        // Add programs
        if (programsRes.data) {
          programsRes.data.forEach((item: any) => {
            allItems.push({ ...item, type: 'program' as const });
          });
        }

        // Add advertisements
        if (adsRes.data) {
          adsRes.data.forEach((item: any) => {
            allItems.push({ ...item, type: 'advertisement' as const });
          });
        }

        // Add concepts
        if (conceptsRes.data) {
          conceptsRes.data.forEach((item: any) => {
            allItems.push({ ...item, type: 'concept' as const });
          });
        }

        // Shuffle the array
        const shuffled = allItems.sort(() => Math.random() - 0.5);
        setWikiItems(shuffled);
      } catch (err) {
        console.error('Error fetching wiki items:', err);
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

  // Calculate parallax offset (only on client side)
  const parallaxOffset = typeof window !== 'undefined' ? {
    x: (mousePosition.x / window.innerWidth - 0.5) * 20,
    y: (mousePosition.y / window.innerHeight - 0.5) * 20,
  } : { x: 0, y: 0 };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16 mt-12">
          <h1 
            className="text-7xl md:text-9xl font-bold mb-4 glitch-text"
            style={{
              color: '#FFFFFF',
              fontFamily: 'var(--font-heebo)',
              textShadow: '0 0 20px rgba(255, 107, 0, 0.5)',
            }}
          >
            יקומה
          </h1>
          <h2 className="text-xl md:text-2xl mb-8" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
            היקום של יקומות
          </h2>
        </div>

        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {user ? (
                <div className="flex items-center gap-3">
                  {userProfile && (
                    <span className="text-sm px-3 py-1 wireframe-border" style={{ fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}>
                      {userProfile.points || 0} נקודות
                    </span>
                  )}
                  <div className="relative group">
                    <button
                      className="w-10 h-10 wireframe-border flex items-center justify-center font-semibold hover:scale-110 transition-transform"
                      style={{ fontFamily: 'var(--font-mono)', color: '#FFFFFF', background: 'transparent' }}
                    >
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </button>
                    <div className="absolute left-0 top-12 bg-black wireframe-border p-2 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="px-3 py-2 text-sm border-b" style={{ color: '#FFFFFF', borderColor: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                        {user.email}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-right px-3 py-2 text-sm rounded mt-1 hover:bg-white/10"
                        style={{ color: '#D62828', fontFamily: 'var(--font-mono)' }}
                      >
                        התנתק
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="control-panel-btn"
                >
                  התחבר
                </Link>
              )}
          </div>
        </div>

        {/* Chapters Section - Control Panel Style */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-4xl font-bold" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>פרקים</h2>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, #FFFFFF, transparent)' }} />
            </div>
          {loading && initialLoad ? (
            <div className="text-center py-12 text-zinc-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <p>אין פרקים זמינים</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chapters.map((chapter, index) => (
                <Link
                  key={chapter.id}
                  href={`/chapter/${chapter.id}`}
                  prefetch={true}
                  className="group relative wireframe-border overflow-hidden glitch-hover"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    background: 'transparent',
                  }}
                  data-title={chapter.title}
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {chapter.image_url ? (
                      <Image
                        src={chapter.image_url}
                        alt={chapter.title}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized={chapter.image_url ? (chapter.image_url.includes('youtube.com') || chapter.image_url.includes('img.youtube.com')) : false}
                        onError={(e) => {
                          // Fallback to YouTube thumbnail if image fails
                          if (!chapter.image_url) return;
                          const videoId = chapter.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
                          if (videoId && !chapter.image_url.includes(videoId)) {
                            e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                          }
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center z-0">
                        <svg className="w-16 h-16" style={{ color: '#008C9E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 px-3 py-1 text-xs wireframe-border" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)', background: '#000000' }}>
                      פרק {chapter.order_index + 1}
                    </div>
                  </div>
                  <div className="p-6 relative z-10">
                    <h3 className="text-xl font-bold mb-2 transition-colors" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                      {chapter.title}
                    </h3>
                    {chapter.description && (
                      <p className="text-sm line-clamp-2 mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)', opacity: 0.7 }}>
                        {chapter.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm transition-colors" style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}>
                      <span>לצפייה בפרק</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                  </div>
                </div>
                </Link>
              ))}
              </div>
            )}
        </section>

        {/* Characters Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-4xl font-bold" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>דמויות</h2>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, #FFFFFF, transparent)' }} />
            <Link
              href="/characters"
              className="text-sm transition-colors wireframe-border px-3 py-1"
              style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}
            >
              הצג הכל →
            </Link>
          </div>
          {charactersLoading ? (
            <div className="text-center py-12 text-zinc-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : characters.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <p>אין דמויות עדיין</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {characters.map((character) => (
                <Link
                  key={character.id}
                  href={`/characters/${character.id}`}
                  className="group character-sandwich wireframe-border overflow-hidden glitch-hover"
                  style={{ background: 'transparent' }}
                  data-title={character.title}
                >
                  <div className="relative aspect-square bg-black character-layer">
                    {character.image_url ? (
                      <Image
                        src={character.image_url}
                        alt={character.title}
                        fill
                        className="object-cover"
                        style={{ mixBlendMode: 'normal' }}
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
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
                  <div className="p-4 text-layer">
                    <h3 className="text-lg font-bold mb-1 transition-colors" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
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
              ))}
            </div>
          )}
        </section>

        {/* Wiki Items Section - Nonsense Grid with Masonry */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-4xl font-bold" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>היקום</h2>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, #FFFFFF, transparent)' }} />
          </div>
          {wikiItemsLoading ? (
            <div className="text-center py-12 text-zinc-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : wikiItems.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <p>אין פריטים עדיין</p>
            </div>
          ) : (
            <div className="masonry-grid">
              {wikiItems.map((item) => {
                const getTypeColors = () => {
                  switch (item.type) {
                    case 'program':
                      return {
                        accentColor: '#008C9E',
                      };
                    case 'advertisement':
                      return {
                        accentColor: '#FF6B00',
                      };
                    case 'concept':
                      return {
                        accentColor: '#D62828',
                      };
                  }
                };

                const getTypeLabel = () => {
                  switch (item.type) {
                    case 'program':
                      return 'תכנית';
                    case 'advertisement':
                      return 'פרסומת';
                    case 'concept':
                      return 'מושג';
                  }
                };

                const getHref = () => {
                  switch (item.type) {
                    case 'program':
                      return `/programs/${item.id}`;
                    case 'advertisement':
                      return `/advertisements/${item.id}`;
                    case 'concept':
                      return `/concepts/${item.id}`;
                  }
                };

                const colors = getTypeColors();
                const href = getHref();
                const randomHeight = Math.floor(Math.random() * 200) + 300; // Varying heights for masonry

                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={href}
                    className="masonry-item wireframe-border overflow-hidden glitch-hover rgb-split"
                    style={{ background: 'transparent', minHeight: `${randomHeight}px` }}
                    data-title={item.title}
                  >
                    <div className="relative bg-black" style={{ height: '200px' }}>
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover"
                          loading="lazy"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-16 h-16" style={{ color: colors.accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {item.type === 'program' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            )}
                            {item.type === 'advertisement' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.533 9.5-3.5C19.532 4.5 22 8.5 22 13c0 1.76-.743 4.5-5.5 4.5s-7.5-2.5-7.5-2.5z" />
                            )}
                            {item.type === 'concept' && (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            )}
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-1 text-xs wireframe-border" style={{ color: colors.accentColor, fontFamily: 'var(--font-mono)', background: '#000000' }}>
                        {getTypeLabel()}
                      </div>
                      {item.verified && (
                        <div className="absolute top-2 left-2 px-2 py-1 text-xs wireframe-border flex items-center gap-1" style={{ color: '#FF6B00', fontFamily: 'var(--font-mono)', background: '#000000' }}>
                          <span>⭐</span>
                          <span>מאומת</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold mb-1 transition-colors glitch-text" style={{ color: colors.accentColor, fontFamily: 'var(--font-heebo)' }}>
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm line-clamp-3 mb-2" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)', opacity: 0.7 }}>
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs" style={{ color: colors.accentColor, fontFamily: 'var(--font-mono)' }}>
                        <span>{item.view_count || 0} צפיות</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
            </div>

    </div>
  );
}
