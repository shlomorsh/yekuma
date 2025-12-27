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
  order_index: number;
  created_at: string;
}

interface WikiStats {
  characters: number;
  programs: number;
  advertisements: number;
  concepts: number;
}

export default function Home() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [wikiStats, setWikiStats] = useState<WikiStats>({ characters: 0, programs: 0, advertisements: 0, concepts: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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
        setLoading(true);
        console.log('Fetching chapters...');
        
        // Fetch chapters - try simple query first
        console.log('Attempting to fetch chapters from Supabase...');
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
        
        // Try a simple count query first to test connection
        const { count: testCount, error: testError } = await supabase
          .from('chapters')
          .select('*', { count: 'exact', head: true });
        
        console.log('Test query result:', { count: testCount, error: testError });
        
        if (testError) {
          console.error('Test query failed:', testError);
          // Use fallback
          setChapters([
            { id: '1', title: 'פרק 1', description: 'פרק ראשון של יקומות', video_url: 'https://www.youtube.com/watch?v=yaY-3H2JN_c', order_index: 0, created_at: new Date().toISOString() },
            { id: '2', title: 'פרק 2', description: 'פרק שני של יקומות', video_url: 'https://www.youtube.com/watch?v=iSHIKkYQ-aI&t=327s', order_index: 1, created_at: new Date().toISOString() },
            { id: '3', title: 'פרק 3', description: 'פרק שלישי של יקומות', video_url: 'https://www.youtube.com/watch?v=Ff8FRXPDk_w', order_index: 2, created_at: new Date().toISOString() },
            { id: '4', title: 'פרק 4', description: 'פרק רביעי של יקומות', video_url: 'https://www.youtube.com/watch?v=N_PsQc4JMpg', order_index: 3, created_at: new Date().toISOString() },
            { id: '5', title: 'פרק 5', description: 'פרק חמישי של יקומות', video_url: 'https://www.youtube.com/watch?v=oYljFReoQbc', order_index: 4, created_at: new Date().toISOString() },
            { id: '6', title: 'פרק 6', description: 'פרק שישי של יקומות', video_url: 'https://www.youtube.com/watch?v=UmOapfxyEZ0', order_index: 5, created_at: new Date().toISOString() },
          ]);
          setLoading(false);
          return;
        }
        
        // If test query works, try full query
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .order('order_index', { ascending: true });
        
        console.log('Chapters query completed:', {
          hasData: !!chaptersData,
          dataLength: chaptersData?.length,
          hasError: !!chaptersError,
          errorCode: chaptersError?.code,
          errorMessage: chaptersError?.message,
          errorDetails: chaptersError?.details,
          errorHint: chaptersError?.hint
        });

        if (chaptersError) {
          console.error('Error fetching chapters:', chaptersError);
          // Fallback
          setChapters([
            { id: '1', title: 'פרק 1', description: 'פרק ראשון של יקומות', video_url: 'https://www.youtube.com/watch?v=yaY-3H2JN_c', order_index: 0, created_at: new Date().toISOString() },
            { id: '2', title: 'פרק 2', description: 'פרק שני של יקומות', video_url: 'https://www.youtube.com/watch?v=iSHIKkYQ-aI&t=327s', order_index: 1, created_at: new Date().toISOString() },
            { id: '3', title: 'פרק 3', description: 'פרק שלישי של יקומות', video_url: 'https://www.youtube.com/watch?v=Ff8FRXPDk_w', order_index: 2, created_at: new Date().toISOString() },
            { id: '4', title: 'פרק 4', description: 'פרק רביעי של יקומות', video_url: 'https://www.youtube.com/watch?v=N_PsQc4JMpg', order_index: 3, created_at: new Date().toISOString() },
            { id: '5', title: 'פרק 5', description: 'פרק חמישי של יקומות', video_url: 'https://www.youtube.com/watch?v=oYljFReoQbc', order_index: 4, created_at: new Date().toISOString() },
            { id: '6', title: 'פרק 6', description: 'פרק שישי של יקומות', video_url: 'https://www.youtube.com/watch?v=UmOapfxyEZ0', order_index: 5, created_at: new Date().toISOString() },
          ]);
        } else if (chaptersData && chaptersData.length > 0) {
          console.log('Setting chapters:', chaptersData.length);
          setChapters(chaptersData);
        } else {
          console.log('No chapters found, using fallback');
          // Fallback
          setChapters([
            { id: '1', title: 'פרק 1', description: 'פרק ראשון של יקומות', video_url: 'https://www.youtube.com/watch?v=yaY-3H2JN_c', order_index: 0, created_at: new Date().toISOString() },
            { id: '2', title: 'פרק 2', description: 'פרק שני של יקומות', video_url: 'https://www.youtube.com/watch?v=iSHIKkYQ-aI&t=327s', order_index: 1, created_at: new Date().toISOString() },
            { id: '3', title: 'פרק 3', description: 'פרק שלישי של יקומות', video_url: 'https://www.youtube.com/watch?v=Ff8FRXPDk_w', order_index: 2, created_at: new Date().toISOString() },
            { id: '4', title: 'פרק 4', description: 'פרק רביעי של יקומות', video_url: 'https://www.youtube.com/watch?v=N_PsQc4JMpg', order_index: 3, created_at: new Date().toISOString() },
            { id: '5', title: 'פרק 5', description: 'פרק חמישי של יקומות', video_url: 'https://www.youtube.com/watch?v=oYljFReoQbc', order_index: 4, created_at: new Date().toISOString() },
            { id: '6', title: 'פרק 6', description: 'פרק שישי של יקומות', video_url: 'https://www.youtube.com/watch?v=UmOapfxyEZ0', order_index: 5, created_at: new Date().toISOString() },
          ]);
        }

        // Fetch wiki stats (with error handling)
        try {
          const [charactersRes, programsRes, adsRes, conceptsRes] = await Promise.all([
            supabase.from('characters').select('id', { count: 'exact', head: true }),
            supabase.from('programs').select('id', { count: 'exact', head: true }),
            supabase.from('advertisements').select('id', { count: 'exact', head: true }),
            supabase.from('concepts').select('id', { count: 'exact', head: true }),
          ]);

          setWikiStats({
            characters: charactersRes.count || 0,
            programs: programsRes.count || 0,
            advertisements: adsRes.count || 0,
            concepts: conceptsRes.count || 0,
          });
        } catch (err) {
          console.warn('Wiki stats not available yet');
        }
    } catch (err) {
        console.error('Unexpected error fetching data:', err);
        // Set fallback chapters on error
        setChapters([
          { id: '1', title: 'פרק 1', description: 'פרק ראשון של יקומות', video_url: 'https://www.youtube.com/watch?v=yaY-3H2JN_c', order_index: 0, created_at: new Date().toISOString() },
          { id: '2', title: 'פרק 2', description: 'פרק שני של יקומות', video_url: 'https://www.youtube.com/watch?v=iSHIKkYQ-aI&t=327s', order_index: 1, created_at: new Date().toISOString() },
          { id: '3', title: 'פרק 3', description: 'פרק שלישי של יקומות', video_url: 'https://www.youtube.com/watch?v=Ff8FRXPDk_w', order_index: 2, created_at: new Date().toISOString() },
          { id: '4', title: 'פרק 4', description: 'פרק רביעי של יקומות', video_url: 'https://www.youtube.com/watch?v=N_PsQc4JMpg', order_index: 3, created_at: new Date().toISOString() },
          { id: '5', title: 'פרק 5', description: 'פרק חמישי של יקומות', video_url: 'https://www.youtube.com/watch?v=oYljFReoQbc', order_index: 4, created_at: new Date().toISOString() },
          { id: '6', title: 'פרק 6', description: 'פרק שישי של יקומות', video_url: 'https://www.youtube.com/watch?v=UmOapfxyEZ0', order_index: 5, created_at: new Date().toISOString() },
        ]);
    } finally {
        console.log('Finished fetching, setting loading to false');
        setLoading(false);
      }
    };

    // Small delay to ensure auth useEffect doesn't block
    const timer = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timer);
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
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              opacity: Math.random() * 0.5 + 0.2,
              animation: `twinkle ${Math.random() * 3 + 2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Gradient Orbs */}
      <div 
        className="fixed w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
        style={{
          left: `${50 + parallaxOffset.x}%`,
          top: `${20 + parallaxOffset.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div 
        className="fixed w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"
        style={{
          left: `${30 + parallaxOffset.x * 0.5}%`,
          top: `${70 + parallaxOffset.y * 0.5}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-16 mt-12">
          <h1 
            className="text-7xl md:text-9xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse"
            style={{
              textShadow: '0 0 40px rgba(59, 130, 246, 0.5)',
            }}
          >
            יקומות
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 mb-8">
            כניסה ליקום חדש של ידע ותוכן
          </p>
        </div>

        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-3">
                  {userProfile && (
                    <span className="text-sm text-zinc-400 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
                      {userProfile.points || 0} נקודות
                    </span>
                  )}
                  <div className="relative group">
                    <button
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold hover:scale-110 transition-transform"
                    >
                      {user.email?.charAt(0).toUpperCase() || 'U'}
                    </button>
                    <div className="absolute left-0 top-12 bg-zinc-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-zinc-700 p-2 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="px-3 py-2 text-sm text-zinc-300 border-b border-zinc-700">
                        {user.email}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-right px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 rounded mt-1"
                      >
                        התנתק
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  התחבר
                </Link>
              )
            )}
          </div>
        </div>

        {/* Chapters Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-4xl font-bold text-white">פרקים</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
            </div>
          {loading ? (
            <div className="text-center py-12 text-zinc-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chapters.map((chapter, index) => (
                <Link
                  key={chapter.id}
                  href={`/chapter/${chapter.id}`}
                  className="group relative bg-zinc-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-zinc-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="relative aspect-video bg-gradient-to-br from-zinc-900 to-black overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                      <div className="w-24 h-24 rounded-full bg-blue-500/20 blur-2xl group-hover:bg-blue-500/40 transition-all" />
                      <svg className="w-16 h-16 text-zinc-600 group-hover:text-blue-500 transition-all z-20 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-lg text-xs text-white z-20 border border-white/10">
                      פרק {chapter.order_index + 1}
              </div>
                  </div>
                  <div className="p-6 relative z-10">
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
                      {chapter.title}
                    </h3>
                    {chapter.description && (
                      <p className="text-zinc-400 text-sm line-clamp-2 mb-4">
                        {chapter.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-zinc-500 group-hover:text-blue-400 transition-colors">
                      <span>לצפייה בפרק</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                  </div>
                </div>
                </Link>
              ))}
              </div>
            )}
        </section>

        {/* Wiki Sections */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-4xl font-bold text-white">היקום</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
                </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Characters */}
            <Link
              href="/characters"
              className="group relative bg-gradient-to-br from-blue-900/30 to-blue-950/30 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/30 transition-colors">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                      </div>
                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">דמויות</h3>
                <p className="text-zinc-400 text-sm mb-4">גלה את כל הדמויות ביקום</p>
                <div className="text-3xl font-bold text-blue-400">{wikiStats.characters}</div>
                <div className="text-sm text-zinc-500 mt-1">ערכים</div>
                    </div>
            </Link>

            {/* Programs */}
            <Link
              href="/programs"
              className="group relative bg-gradient-to-br from-purple-900/30 to-purple-950/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-500/30 transition-colors">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                          </div>
                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">תכניות</h3>
                <p className="text-zinc-400 text-sm mb-4">כל התכניות ביקום</p>
                <div className="text-3xl font-bold text-purple-400">{wikiStats.programs}</div>
                <div className="text-sm text-zinc-500 mt-1">ערכים</div>
                        </div>
            </Link>

            {/* Advertisements */}
            <Link
              href="/advertisements"
              className="group relative bg-gradient-to-br from-pink-900/30 to-pink-950/30 backdrop-blur-sm rounded-2xl p-8 border border-pink-500/30 hover:border-pink-500 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/20 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-500/30 transition-colors">
                  <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.533 9.5-3.5C19.532 4.5 22 8.5 22 13c0 1.76-.743 4.5-5.5 4.5s-7.5-2.5-7.5-2.5z" />
                  </svg>
                      </div>
                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-pink-400 transition-colors">פרסומות</h3>
                <p className="text-zinc-400 text-sm mb-4">פרסומות מהיקום</p>
                <div className="text-3xl font-bold text-pink-400">{wikiStats.advertisements}</div>
                <div className="text-sm text-zinc-500 mt-1">ערכים</div>
                        </div>
            </Link>

            {/* Concepts */}
            <Link
              href="/concepts"
              className="group relative bg-gradient-to-br from-cyan-900/30 to-cyan-950/30 backdrop-blur-sm rounded-2xl p-8 border border-cyan-500/30 hover:border-cyan-500 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-cyan-500/30 transition-colors">
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
              </div>
                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">מושגים</h3>
                <p className="text-zinc-400 text-sm mb-4">מושגים מרכזיים</p>
                <div className="text-3xl font-bold text-cyan-400">{wikiStats.concepts}</div>
                <div className="text-sm text-zinc-500 mt-1">ערכים</div>
                </div>
            </Link>
                </div>
        </section>
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
