"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as React.ComponentType<any>;

interface Reference {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  imageUrl: string;
  userId?: string;
  username?: string;
  userPoints?: number;
  verified?: boolean;
  verificationCount?: number;
  hasUserVerified?: boolean;
  chapterId?: string;
  linkedReferences?: Reference[];
}

interface Chapter {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  order_index: number;
}

export default function ChapterPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.chapterId as string;
  
  const playerRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedReference, setSelectedReference] = useState<Reference | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    timestamp: 0,
    title: "",
    description: "",
    imageUrl: "https://via.placeholder.com/400x300/1f2937/9ca3af?text=רפרנס+חדש"
  });
  
  // Authentication state
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLinkedRefsModal, setShowLinkedRefsModal] = useState(false);
  const [availableReferences, setAvailableReferences] = useState<Reference[]>([]);
  const [loadingLinkedRefs, setLoadingLinkedRefs] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkSession = async () => {
      try {
        setAuthLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          setEmail(session.user.email || "");
          await fetchUserProfile(session.user.id);
        }
      } catch (err: any) {
        console.error('Error checking session:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setEmail(session.user.email || "");
        await fetchUserProfile(session.user.id);
        setShowLoginModal(false);
      } else {
        setUser(null);
        setEmail("");
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
        const { data: session } = await supabase.auth.getSession();
        const email = session?.session?.user?.email || '';
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

  // Hardcoded chapters fallback
  const fallbackChapters: Record<string, Chapter> = {
    '1': { id: '1', title: 'פרק 1', description: 'פרק ראשון של יקומות', video_url: 'https://www.youtube.com/watch?v=yaY-3H2JN_c', order_index: 0 },
    '2': { id: '2', title: 'פרק 2', description: 'פרק שני של יקומות', video_url: 'https://www.youtube.com/watch?v=iSHIKkYQ-aI&t=327s', order_index: 1 },
    '3': { id: '3', title: 'פרק 3', description: 'פרק שלישי של יקומות', video_url: 'https://www.youtube.com/watch?v=Ff8FRXPDk_w', order_index: 2 },
    '4': { id: '4', title: 'פרק 4', description: 'פרק רביעי של יקומות', video_url: 'https://www.youtube.com/watch?v=N_PsQc4JMpg', order_index: 3 },
    '5': { id: '5', title: 'פרק 5', description: 'פרק חמישי של יקומות', video_url: 'https://www.youtube.com/watch?v=oYljFReoQbc', order_index: 4 },
    '6': { id: '6', title: 'פרק 6', description: 'פרק שישי של יקומות', video_url: 'https://www.youtube.com/watch?v=UmOapfxyEZ0', order_index: 5 },
  };

  // Fetch chapter
  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterId) return;
      
      try {
        const { data, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', chapterId)
          .single();

        if (error) {
          // Check if table doesn't exist or chapter not found - use fallback
          if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            console.warn('Chapters table does not exist or chapter not found, using fallback');
            if (fallbackChapters[chapterId]) {
              setChapter(fallbackChapters[chapterId]);
            }
            return;
          }
          console.error('Error fetching chapter:', {
            message: error.message,
            code: error.code,
            details: error.details
          });
          // Try fallback if chapter ID matches
          if (fallbackChapters[chapterId]) {
            setChapter(fallbackChapters[chapterId]);
          }
          return;
        }

        if (data) {
          setChapter(data);
        } else {
          // No data found, try fallback
          if (fallbackChapters[chapterId]) {
            setChapter(fallbackChapters[chapterId]);
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        // Try fallback on error
        if (fallbackChapters[chapterId]) {
          setChapter(fallbackChapters[chapterId]);
        }
      }
    };

    fetchChapter();
  }, [chapterId]);

  // Handle URL parameters for opening specific reference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref');
    const timeParam = urlParams.get('time');
    
    if (refId && timeParam && references.length > 0 && isReady) {
      const ref = references.find(r => r.id === refId);
      if (ref) {
        setSelectedReference(ref);
        // Seek to the timestamp
        if (playerRef.current) {
          const time = parseInt(timeParam);
          if (typeof playerRef.current.currentTime === "number") {
            playerRef.current.currentTime = time;
          } else if (playerRef.current.seekTo) {
            playerRef.current.seekTo(time, "seconds");
          }
          setPlaying(true);
        }
        // Clean URL
        router.replace(`/chapter/${chapterId}`, { scroll: false });
      }
    }
  }, [references, isReady, chapterId, router]);

  // Fetch references for this chapter
  useEffect(() => {
    const fetchReferences = async () => {
      if (!chapterId) return;
      
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id;

        // Fetch references for this chapter
        const { data: refsData, error: refsError } = await supabase
          .from('references')
          .select('id, timestamp, title, description, image_url, user_id, verified, verification_count, chapter_id')
          .eq('chapter_id', chapterId)
          .order('timestamp', { ascending: true });

        if (refsError) {
          // Check if it's a table/column doesn't exist error
          if (refsError.code === '42P01' || refsError.code === '42703' || refsError.message?.includes('does not exist')) {
            console.warn('References table or chapter_id column does not exist yet. Please run setup-chapters-system.sql');
            setReferences([]);
            setLoading(false);
            return;
          }
          console.error('Error fetching references:', {
            message: refsError.message,
            code: refsError.code,
            details: refsError.details,
            hint: refsError.hint
          });
          setReferences([]);
          setLoading(false);
          return;
        }

        // Handle case where no references exist (empty array is valid)
        if (refsData !== null) {
          // Get unique user IDs
          const userIds = [...new Set(refsData.map((ref: any) => ref.user_id).filter(Boolean))];
          
          // Fetch profiles
          let profilesMap: Record<string, any> = {};
          if (userIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, username, points')
              .in('id', userIds);
            
            if (profilesError) {
              console.warn('Error fetching profiles:', profilesError);
            } else if (profilesData) {
              profilesMap = profilesData.reduce((acc: any, profile: any) => {
                acc[profile.id] = profile;
                return acc;
              }, {});
            }
          }

          // Check verifications
          let userVerifications: string[] = [];
          if (currentUserId) {
            const { data: verifications, error: verificationsError } = await supabase
              .from('verifications')
              .select('reference_id')
              .eq('user_id', currentUserId);
            
            if (verificationsError) {
              console.warn('Error fetching verifications:', verificationsError);
            } else if (verifications) {
              userVerifications = verifications.map(v => v.reference_id);
            }
          }

          // Fetch linked references for each reference
          const referencesWithLinks = await Promise.all(
            refsData.map(async (ref: any) => {
              // Get linked references
              const { data: links, error: linksError } = await supabase
                .from('reference_links')
                .select('target_reference_id')
                .eq('source_reference_id', ref.id);

              let linkedRefs: Reference[] = [];
              if (!linksError && links && links.length > 0) {
                const targetIds = links.map(l => l.target_reference_id);
                const { data: linkedRefsData, error: linkedRefsError } = await supabase
                  .from('references')
                  .select('id, timestamp, title, description, image_url, user_id, verified, verification_count, chapter_id')
                  .in('id', targetIds);

                if (!linkedRefsError && linkedRefsData) {
                  linkedRefs = linkedRefsData.map((lr: any) => {
                    const lrUserId = lr.user_id;
                    const lrProfile = lrUserId ? (profilesMap[lrUserId] || {}) : null;
                    return {
                      id: lr.id.toString(),
                      timestamp: lr.timestamp || 0,
                      title: lr.title || '',
                      description: lr.description || '',
                      imageUrl: lr.image_url || "https://via.placeholder.com/400x300/1f2937/9ca3af?text=רפרנס",
                      userId: lrUserId,
                      username: lrUserId ? (lrProfile?.username || 'Unknown') : 'Anonymous',
                      userPoints: lrUserId ? (lrProfile?.points || 0) : 0,
                      verified: lr.verified || false,
                      verificationCount: lr.verification_count || 0,
                      chapterId: lr.chapter_id
                    };
                  });
                }
              }

              const userId = ref.user_id;
              const profile = userId ? (profilesMap[userId] || {}) : null;
              
              return {
                id: ref.id.toString(),
                timestamp: ref.timestamp || 0,
                title: ref.title || '',
                description: ref.description || '',
                imageUrl: ref.image_url || "https://via.placeholder.com/400x300/1f2937/9ca3af?text=רפרנס",
                userId: userId,
                username: userId ? (profile?.username || 'Unknown') : 'Anonymous',
                userPoints: userId ? (profile?.points || 0) : 0,
                verified: ref.verified || false,
                verificationCount: ref.verification_count || 0,
                hasUserVerified: userVerifications.includes(ref.id),
                chapterId: ref.chapter_id,
                linkedReferences: linkedRefs
              };
            })
          );

          setReferences(referencesWithLinks);
        } else {
          // No references found (empty array)
          setReferences([]);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReferences();
  }, [chapterId, user]);

  // Fetch top contributors
  useEffect(() => {
    const fetchTopContributors = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, points')
          .order('points', { ascending: false })
          .limit(5);

        if (data) {
          setTopContributors(data);
        }
      } catch (err) {
        console.error('Error fetching top contributors:', err);
      }
    };

    fetchTopContributors();
  }, []);

  const handleReferenceClick = (reference: Reference) => {
    if (playerRef.current && isReady) {
      if (typeof playerRef.current.currentTime === "number") {
        playerRef.current.currentTime = reference.timestamp;
        setPlaying(true);
      } else if (playerRef.current.seekTo) {
        playerRef.current.seekTo(reference.timestamp, "seconds");
        setPlaying(true);
      }
    }
    setSelectedReference(reference);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddReferenceClick = () => {
    if (!user) {
      alert("אתה צריך להתחבר כדי להוסיף רפרנס. אנא התחבר תחילה.");
      setShowLoginModal(true);
      return;
    }

    if (playerRef.current && isReady) {
      const currentTime = typeof playerRef.current.currentTime === "number" 
        ? Math.floor(playerRef.current.currentTime)
        : 0;
      
      setPlaying(false);
      setFormData({
        timestamp: currentTime,
        title: "",
        description: "",
        imageUrl: "https://via.placeholder.com/400x300/1f2937/9ca3af?text=רפרנס+חדש"
      });
      setShowAddForm(true);
    }
  };

  const handleSaveReference = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert("אנא הכנס כותרת");
      return;
    }

    if (!user || !chapterId) {
      alert("אתה צריך להתחבר כדי לשמור רפרנס");
      return;
    }

    try {
      setSaving(true);
      
      // Check for existing references within +/- 3 seconds
      const { data: existingRefs } = await supabase
        .from('references')
        .select('id')
        .eq('chapter_id', chapterId)
        .gte('timestamp', formData.timestamp - 3)
        .lte('timestamp', formData.timestamp + 3);

      if (existingRefs && existingRefs.length > 0) {
        alert("רפרנס כבר קיים ברגע הזה.");
        setSaving(false);
        return;
      }

      const insertData: any = {
        timestamp: formData.timestamp,
        title: formData.title,
        description: formData.description,
        image_url: formData.imageUrl || "https://via.placeholder.com/400x300/1f2937/9ca3af?text=רפרנס+חדש",
        user_id: user.id,
        chapter_id: chapterId,
        verified: false,
        verification_count: 0
      };
      
      const { data, error } = await supabase
        .from('references')
        .insert([insertData])
        .select('id, timestamp, title, description, image_url, user_id, verified, verification_count, chapter_id')
        .single();

      if (error) {
        console.error('Error saving reference:', error);
        alert('נכשל בשמירת הרפרנס: ' + error.message);
        setSaving(false);
        return;
      }

      if (data) {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, points')
          .eq('id', user.id)
          .maybeSingle();

        const profile = profileData as { username?: string; points?: number } | null;
        const newReference: Reference = {
          id: data.id.toString(),
          timestamp: data.timestamp,
          title: data.title,
          description: data.description || '',
          imageUrl: data.image_url || "https://via.placeholder.com/400x300/1f2937/9ca3af?text=רפרנס",
          userId: data.user_id,
          username: profile?.username || 'Unknown',
          userPoints: profile?.points || 0,
          verified: data.verified || false,
          verificationCount: data.verification_count || 0,
          hasUserVerified: false,
          chapterId: data.chapter_id,
          linkedReferences: []
        };

        setReferences([...references, newReference]);
        setSelectedReference(newReference);
        setFormData({
          timestamp: 0,
          title: "",
          description: "",
          imageUrl: "https://via.placeholder.com/400x300/1f2937/9ca3af?text=רפרנס+חדש"
        });
        setShowAddForm(false);
      }
    } catch (err: any) {
      console.error('Unexpected error:', err);
      alert('שגיאה בלתי צפויה: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (referenceId: string, creatorUserId: string) => {
    if (!user || !creatorUserId || user.id === creatorUserId) {
      return;
    }

    try {
      const { data: existingVerification } = await supabase
        .from('verifications')
        .select('id')
        .eq('reference_id', referenceId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVerification) {
        alert("כבר אימתת את הרפרנס הזה");
        return;
      }

      await supabase
        .from('verifications')
        .insert([{
          reference_id: referenceId,
          user_id: user.id
        }]);

      const { count } = await supabase
        .from('verifications')
        .select('id', { count: 'exact', head: true })
        .eq('reference_id', referenceId);

      const newCount = (count || 0);
      const isVerified = newCount >= 2;

      await supabase
        .from('references')
        .update({
          verification_count: newCount,
          verified: isVerified
        })
        .eq('id', referenceId);

      // Refresh references
      window.location.reload();
    } catch (err) {
      console.error('Error verifying:', err);
    }
  };

  const handleAddLinkedReference = async () => {
    if (!selectedReference) return;
    
    setLoadingLinkedRefs(true);
    try {
      // Fetch all references from all chapters
      const { data: allRefs } = await supabase
        .from('references')
        .select('id, timestamp, title, description, image_url, user_id, verified, verification_count, chapter_id')
        .order('timestamp', { ascending: true });

      if (allRefs) {
        // Get user profiles
        const userIds = [...new Set(allRefs.map((ref: any) => ref.user_id).filter(Boolean))];
        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username, points')
            .in('id', userIds);
          
          if (profilesData) {
            profilesMap = profilesData.reduce((acc: any, profile: any) => {
              acc[profile.id] = profile;
              return acc;
            }, {});
          }
        }

        // Get chapters for display
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('id, title');

        const chaptersMap: Record<string, string> = {};
        if (chaptersData) {
          chaptersData.forEach((ch: any) => {
            chaptersMap[ch.id] = ch.title;
          });
        }

        const mappedRefs: Reference[] = allRefs
          .filter((ref: any) => ref.id !== selectedReference.id)
          .map((ref: any) => {
            const userId = ref.user_id;
            const profile = userId ? (profilesMap[userId] || {}) : null;
            
            return {
              id: ref.id.toString(),
              timestamp: ref.timestamp || 0,
              title: ref.title || '',
              description: ref.description || '',
              imageUrl: ref.image_url || "https://via.placeholder.com/400x300/1f2937/9ca3af?text=רפרנס",
              userId: userId,
              username: userId ? (profile?.username || 'Unknown') : 'Anonymous',
              userPoints: userId ? (profile?.points || 0) : 0,
              verified: ref.verified || false,
              verificationCount: ref.verification_count || 0,
              chapterId: ref.chapter_id
            };
          });

        setAvailableReferences(mappedRefs);
        setShowLinkedRefsModal(true);
      }
    } catch (err) {
      console.error('Error loading references:', err);
    } finally {
      setLoadingLinkedRefs(false);
    }
  };

  const handleLinkReference = async (targetRefId: string) => {
    if (!selectedReference) return;

    try {
      const { error } = await supabase
        .from('reference_links')
        .insert([{
          source_reference_id: selectedReference.id,
          target_reference_id: targetRefId
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert("הרפרנס כבר מקושר");
        } else {
          alert("שגיאה בקישור רפרנס: " + error.message);
        }
        return;
      }

      alert("רפרנס מקושר בהצלחה!");
      setShowLinkedRefsModal(false);
      // Refresh page to show linked references
      window.location.reload();
    } catch (err) {
      console.error('Error linking reference:', err);
      alert("שגיאה בלתי צפויה");
    }
  };

  const handleOpenLinkedReference = async (linkedRef: Reference) => {
    // Open in new window/tab
    const url = `/chapter/${linkedRef.chapterId}?ref=${linkedRef.id}&time=${linkedRef.timestamp}`;
    window.open(url, '_blank');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail.trim()) {
      setLoginMessage("אנא הכנס כתובת אימייל");
      return;
    }

    try {
      setLoginLoading(true);
      setLoginMessage("");

      const { error } = await supabase.auth.signInWithOtp({
        email: loginEmail,
        options: {
          emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setLoginMessage('שגיאה בשליחת קישור: ' + error.message);
        return;
      }

      setLoginMessage("בדוק את האימייל שלך לקבלת קישור ההתחברות!");
      setTimeout(() => {
        setShowLoginModal(false);
      }, 2000);
    } catch (err) {
      console.error('Unexpected error:', err);
      setLoginMessage('שגיאה בלתי צפויה');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
        return;
      }
      setUser(null);
      setEmail("");
      setUserProfile(null);
      setShowAddForm(false);
    } catch (err) {
      console.error('Unexpected error:', err);
    }
  };

  if (!chapter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl mb-4">טוען פרק...</div>
          {loading && <div className="text-zinc-400">אנא המתן</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← חזרה לדף הבית
            </Link>
            <h1 className="text-2xl font-bold text-white">{chapter.title}</h1>
          </div>
          <div className="flex items-center gap-4">
            {!authLoading && (
              user ? (
                <div className="flex items-center gap-3">
                  {userProfile && (
                    <span className="text-sm text-zinc-400">
                      {userProfile.points || 0} נקודות
                    </span>
                  )}
                  <div className="relative group">
                    <button
                      className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold hover:bg-blue-700 transition-colors"
                    >
                      {email.charAt(0).toUpperCase()}
                    </button>
                    <div className="absolute left-0 top-12 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 p-2 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="px-3 py-2 text-sm text-zinc-300 border-b border-zinc-700">
                        {email}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-right px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 rounded mt-1"
                      >
                        התנתק
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  התחבר
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Add Reference Button */}
            <div className="flex justify-end">
              <button
                onClick={handleAddReferenceClick}
                disabled={!isReady}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                הוסף רפרנס
              </button>
            </div>

            {/* Video Player */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl border border-zinc-800 relative">
              <ReactPlayer
                ref={playerRef}
                url={chapter.video_url}
                width="100%"
                height="100%"
                playing={playing}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onReady={() => setIsReady(true)}
                controls
                className="aspect-video"
              />
            </div>

            {/* Add Reference Form */}
            {showAddForm && user && (
              <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-zinc-800">
                <h2 className="text-2xl font-bold mb-4 text-white">הוסף רפרנס חדש</h2>
                <form onSubmit={handleSaveReference} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      זמן (נלכד מהוידאו)
                    </label>
                    <input
                      type="text"
                      value={formatTime(formData.timestamp)}
                      readOnly
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      כותרת <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="הכנס כותרת רפרנס"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      תיאור
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="הכנס תיאור רפרנס"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      כתובת תמונה (אופציונלי)
                    </label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
                    >
                      {saving ? 'שומר...' : 'שמור רפרנס'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          timestamp: 0,
                          title: "",
                          description: "",
                          imageUrl: "https://via.placeholder.com/400x300/1f2937/9ca3af?text=רפרנס+חדש"
                        });
                        setShowAddForm(false);
                      }}
                      className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
                    >
                      ביטול
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reference Details */}
            {selectedReference && (
              <div className={`bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 shadow-2xl border-2 ${
                selectedReference.verified 
                  ? "border-yellow-500/50 bg-yellow-950/10" 
                  : "border-zinc-800"
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">פרטי רפרנס</h2>
                    {selectedReference.verified && (
                      <span className="flex items-center gap-1 text-yellow-400 font-semibold bg-yellow-950/30 px-3 py-1 rounded-lg border border-yellow-500/50">
                        <span>⭐</span>
                        <span>מאומת</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {user && selectedReference.userId && selectedReference.userId !== user.id && !selectedReference.hasUserVerified && !selectedReference.verified && (
                      <button
                        onClick={() => handleVerify(selectedReference.id, selectedReference.userId || '')}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        <span>👍</span>
                        <span>אמת</span>
                      </button>
                    )}
                    {selectedReference.hasUserVerified && (
                      <span className="flex items-center gap-2 text-green-400 font-semibold">
                        <span>✓</span>
                        <span>אומת על ידיך</span>
                      </span>
                    )}
                    {user && (
                      <button
                        onClick={handleAddLinkedReference}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        <span>🔗</span>
                        <span>קשר רפרנס</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-xl font-semibold mb-3 text-white">{selectedReference.title}</h3>
                    <p className="text-zinc-300 leading-relaxed mb-4">{selectedReference.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-mono bg-zinc-800 px-3 py-1 rounded-md text-zinc-400">
                        {formatTime(selectedReference.timestamp)}
                      </span>
                      <span className="text-zinc-400">
                        נוסף על ידי: <span className="text-white font-medium">{selectedReference.username}</span>
                        {selectedReference.userPoints !== undefined && selectedReference.userId && (
                          <span className="text-blue-400 mr-1">({selectedReference.userPoints} נק')</span>
                        )}
                      </span>
                      {selectedReference.verificationCount !== undefined && selectedReference.verificationCount > 0 && (
                        <span className="text-zinc-400">
                          {selectedReference.verificationCount} אימותים
                        </span>
                      )}
                    </div>
                    {/* Linked References */}
                    {selectedReference.linkedReferences && selectedReference.linkedReferences.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-3 text-white">רפרנסים מקושרים:</h4>
                        <div className="space-y-2">
                          {selectedReference.linkedReferences.map((linkedRef) => (
                            <button
                              key={linkedRef.id}
                              onClick={() => handleOpenLinkedReference(linkedRef)}
                              className="w-full text-right bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg p-3 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-white font-medium">{linkedRef.title}</div>
                                  <div className="text-sm text-zinc-400 mt-1">
                                    {formatTime(linkedRef.timestamp)}
                                  </div>
                                </div>
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-1">
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700">
                      <Image
                        src={selectedReference.imageUrl}
                        alt={selectedReference.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Top Contributors */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-zinc-800">
              <h2 className="text-xl font-bold mb-4 text-white">5 התורמים המובילים</h2>
              {topContributors.length === 0 ? (
                <div className="text-center py-4 text-zinc-400 text-sm">
                  אין תורמים עדיין
                </div>
              ) : (
                <div className="space-y-2">
                  {topContributors.map((contributor, index) => (
                    <div
                      key={contributor.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 font-bold w-6 text-center">
                          {index + 1}
                        </span>
                        <span className="text-white font-medium text-sm">
                          {contributor.username || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-blue-400 font-semibold">
                        {contributor.points || 0} נק'
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* References List */}
            <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-zinc-800 sticky top-8">
              <h2 className="text-xl font-bold mb-6 text-white">רפרנסים</h2>
              {loading ? (
                <div className="text-center py-8 text-zinc-400">
                  טוען רפרנסים...
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {references.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                      אין רפרנסים עדיין. הוסף אחד כדי להתחיל!
                    </div>
                  ) : (
                    references.map((ref) => (
                      <div
                        key={ref.id}
                        className={`w-full rounded-lg transition-all duration-200 border-2 ${
                          ref.verified
                            ? "border-yellow-500/50 bg-yellow-950/20"
                            : selectedReference?.id === ref.id
                            ? "bg-blue-950/50 border-blue-500 shadow-lg shadow-blue-500/20"
                            : "bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800"
                        }`}
                      >
                        <button
                          onClick={() => handleReferenceClick(ref)}
                          className="w-full text-right p-4"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className={`font-semibold text-sm ${
                                  selectedReference?.id === ref.id ? "text-blue-300" : "text-white"
                                }`}>
                                  {ref.title}
                                </span>
                                {ref.verified && (
                                  <span className="text-yellow-400 text-xs" title="מאומת">
                                    ⭐
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs font-mono px-2 py-1 rounded ${
                                selectedReference?.id === ref.id
                                  ? "bg-blue-900/50 text-blue-300"
                                  : "bg-zinc-700 text-zinc-400"
                              }`}>
                                {formatTime(ref.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              <span>נוסף על ידי: <span className="text-white font-medium">{ref.username}</span></span>
                              {ref.userPoints !== undefined && ref.userId && (
                                <span className="text-blue-400">({ref.userPoints} נק')</span>
                              )}
                            </div>
                            {ref.linkedReferences && ref.linkedReferences.length > 0 && (
                              <div className="text-xs text-purple-400 mt-1">
                                🔗 {ref.linkedReferences.length} רפרנסים מקושרים
                              </div>
                            )}
                          </div>
                        </button>
                        {user && ref.userId && ref.userId !== user.id && !ref.hasUserVerified && !ref.verified && (
                          <div className="px-4 pb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerify(ref.id, ref.userId || '');
                              }}
                              className="w-full flex items-center justify-center gap-2 bg-green-600/80 hover:bg-green-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors duration-200 text-sm"
                            >
                              <span>👍</span>
                              <span>אמת</span>
                            </button>
                          </div>
                        )}
                        {ref.hasUserVerified && (
                          <div className="px-4 pb-3">
                            <div className="w-full flex items-center justify-center gap-2 bg-green-600/30 text-green-400 font-semibold px-3 py-1.5 rounded-lg text-sm">
                              <span>✓</span>
                              <span>אומת על ידיך</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-xl p-6 shadow-2xl border border-zinc-800 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">התחברות</h2>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginMessage("");
                  }}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    כתובת אימייל
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginMessage("");
                    }}
                    placeholder="הכנס את כתובת האימייל שלך"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                {loginMessage && (
                  <p className={`text-sm ${loginMessage.includes("בדוק") ? "text-green-400" : "text-red-400"}`}>
                    {loginMessage}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-lg transition-colors duration-200"
                  >
                    {loginLoading ? "שולח..." : "שלח קישור התחברות"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLoginModal(false);
                      setLoginMessage("");
                    }}
                    className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold rounded-lg transition-colors duration-200"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Linked References Modal */}
        {showLinkedRefsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-xl p-6 shadow-2xl border border-zinc-800 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">בחר רפרנס לקישור</h2>
                <button
                  onClick={() => {
                    setShowLinkedRefsModal(false);
                    setAvailableReferences([]);
                  }}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {loadingLinkedRefs ? (
                <div className="text-center py-8 text-zinc-400">
                  טוען רפרנסים...
                </div>
              ) : (
                <div className="overflow-y-auto flex-1 space-y-2">
                  {availableReferences.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400">
                      אין רפרנסים זמינים
                    </div>
                  ) : (
                    availableReferences.map((ref) => (
                      <button
                        key={ref.id}
                        onClick={() => handleLinkReference(ref.id)}
                        className="w-full text-right bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg p-4 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-medium">{ref.title}</div>
                            <div className="text-sm text-zinc-400 mt-1">
                              {formatTime(ref.timestamp)} • {ref.username}
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

