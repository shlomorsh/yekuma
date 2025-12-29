"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import ContractModal from "@/app/components/ContractModal";

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
  item_type: 'program' | 'advertisement' | 'concept';
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
  const [showContractModal, setShowContractModal] = useState(false);

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

  // Check authentication status and handle auto-login
  useEffect(() => {
    const checkSession = async () => {
      try {
        setAuthLoading(true);

        if (typeof window === 'undefined') {
          setAuthLoading(false);
          return;
        }

        // Get the current session first
        const { data: { session }, error } = await supabase.auth.getSession();

        // If already logged in, skip auto-login
        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
          setAuthLoading(false);
          return;
        }

        // Try auto-login if credentials are saved and no session exists
        const STORAGE_KEY = "yekumot_credentials";
        const saved = localStorage.getItem(STORAGE_KEY);
        
        if (saved) {
          try {
            const credentials = JSON.parse(saved);
            if (credentials.email && credentials.password) {
              // Try to sign in with saved credentials
              const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
              });

              if (!signInError && data?.session) {
                setUser(data.session.user);
                await fetchUserProfile(data.session.user.id);
                setAuthLoading(false);
                return;
              } else {
                // Auto-login failed, clear saved credentials
                localStorage.removeItem(STORAGE_KEY);
              }
            }
          } catch (err) {
            // Invalid saved credentials, clear them
            localStorage.removeItem(STORAGE_KEY);
          }
        }

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

        // Test connection first
        try {
          console.log('[Home] Testing Supabase connection...');
          const testResult = await supabase.from('chapters').select('id').limit(1);
          console.log('[Home] Connection test result:', {
            hasData: !!testResult.data,
            hasError: !!testResult.error,
            error: testResult.error
          });
        } catch (testErr: any) {
          console.error('[Home] Connection test failed:', testErr);
        }

        try {
          console.log('[Home] Making Supabase request...');
          
          const { data, error } = await supabase
            .from('chapters')
            .select('id, title, description, video_url, image_url, order_index, created_at')
            .order('order_index', { ascending: true });

          const elapsed = Date.now() - startTime;
          console.log('[Home] Chapters fetch completed in', elapsed, 'ms', {
            hasData: !!data,
            dataLength: data?.length,
            hasError: !!error,
            error: error
          });

          if (error) {
            console.error('[Home] Supabase error:', error);
            setChapters([]);
          } else if (data) {
            setChapters(data);
          } else {
            console.error('[Home] No data returned');
            setChapters([]);
          }
        } catch (err: any) {
          console.error('[Home] Chapters fetch exception:', err);
          console.error('[Home] Exception details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
          setChapters([]);
        }

        // Fetch wiki stats (with error handling)
        try {
          console.log('[Home] Fetching wiki stats...');
          
          const [charactersRes, universeItemsRes] = await Promise.all([
            supabase.from('characters').select('id', { count: 'exact', head: true }),
            supabase.from('universe_items').select('id, item_type', { count: 'exact' }),
          ]);

          // Count items by type from universe_items
          const programsCount = universeItemsRes.data?.filter((item: any) => item.item_type === 'program').length || 0;
          const adsCount = universeItemsRes.data?.filter((item: any) => item.item_type === 'advertisement').length || 0;
          const conceptsCount = universeItemsRes.data?.filter((item: any) => item.item_type === 'concept').length || 0;

          console.log('[Home] Wiki stats:', {
            characters: charactersRes.count,
            programs: programsCount,
            advertisements: adsCount,
            concepts: conceptsCount
          });

          setWikiStats({
            characters: charactersRes.count || 0,
            programs: programsCount,
            advertisements: adsCount,
            concepts: conceptsCount,
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

        try {
          console.log('[Home] Making characters Supabase request...');
          
          const { data, error } = await supabase
            .from('characters')
            .select('id, title, description, image_url, view_count, verified')
            .order('title', { ascending: true })
            .limit(12);

          console.log('[Home] Characters fetch completed in', Date.now() - startTime, 'ms');

          if (error) {
            console.error('[Home] Error fetching characters:', error);
            console.error('[Home] Error details:', {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint
            });
            setCharacters([]);
          } else {
            console.log('[Home] Setting characters:', data?.length || 0);
            setCharacters(data || []);
          }
        } catch (err: any) {
          console.error('[Home] Characters fetch exception:', err);
          console.error('[Home] Exception details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
          setCharacters([]);
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

        // Fetch all items from the unified universe_items table
        const startTime = Date.now();

        try {
          console.log('[Home] Making universe_items Supabase request...');
          
          const { data, error } = await supabase
            .from('universe_items')
            .select('id, title, description, image_url, view_count, verified, item_type')
            .order('created_at', { ascending: false })
            .limit(60);

          console.log('[Home] Universe items fetch completed in', Date.now() - startTime, 'ms');

          if (error) {
            console.error('[Home] Universe items fetch error:', error);
            console.error('[Home] Error details:', {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint
            });
            setWikiItems([]);
          } else {
            // Shuffle the array for variety
            const shuffled = (data || []).sort(() => Math.random() - 0.5);
            setWikiItems(shuffled);
          }
        } catch (err: any) {
          console.error('[Home] Universe items fetch exception:', err);
          console.error('[Home] Exception details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
          setWikiItems([]);
        }
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
      // Clear saved credentials on logout
      localStorage.removeItem("yekumot_credentials");
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
              <button
                onClick={() => setShowContractModal(true)}
                className="control-panel-btn"
              >
                התחבר
              </button>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {wikiItems.map((item, index) => {
                const getHref = () => {
                  return `/universe/${item.id}`;
                };

                const href = getHref();

                return (
                  <Link
                    key={`${item.item_type}-${item.id}`}
                    href={href}
                    className="group relative wireframe-border overflow-hidden glitch-hover aspect-square"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      background: 'transparent',
                    }}
                    data-title={item.title}
                  >
                    <div className="relative w-full h-full bg-black">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover"
                          loading="lazy"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-black" />
                      )}
                      {item.verified && (
                        <div className="absolute top-2 left-2 px-2 py-1 text-xs wireframe-border flex items-center gap-1" style={{ color: '#FF6B00', fontFamily: 'var(--font-mono)', background: '#000000' }}>
                          <span>⭐</span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <ContractModal 
        isOpen={showContractModal} 
        onClose={() => setShowContractModal(false)} 
      />
    </div>
  );
}

