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
  image_url: string | null;
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
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLinkedRefsModal, setShowLinkedRefsModal] = useState(false);
  const [availableReferences, setAvailableReferences] = useState<Reference[]>([]);
  const [loadingLinkedRefs, setLoadingLinkedRefs] = useState(false);
  const [targetingMode, setTargetingMode] = useState(false);
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 0, y: 0 });
  const [isEditingReference, setIsEditingReference] = useState(false);
  const [editReferenceData, setEditReferenceData] = useState({
    title: "",
    description: "",
    imageUrl: ""
  });

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


  // Fetch chapter
  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterId) return;
      
      try {
        setLoading(true);
        
        let data, error;
        try {
          const result = await Promise.race([
            supabase
              .from('chapters')
              .select('id, title, description, video_url, image_url, order_index')
              .eq('id', chapterId)
              .single(),
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
          console.error('Error fetching chapter:', error);
          setLoading(false);
          return;
        }

        if (data) {
          setChapter(data);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
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
        if (playerRef.current) {
          const time = parseInt(timeParam);
          if (typeof playerRef.current.currentTime === "number") {
            playerRef.current.currentTime = time;
          } else if (playerRef.current.seekTo) {
            playerRef.current.seekTo(time, "seconds");
          }
          setPlaying(true);
        }
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

        const { data: refsData, error: refsError } = await supabase
          .from('references')
          .select('id, timestamp, title, description, image_url, user_id, verified, verification_count, chapter_id')
          .eq('chapter_id', chapterId)
          .order('timestamp', { ascending: true });

        if (refsError) {
          if (refsError.code === '42P01' || refsError.code === '42703' || refsError.message?.includes('does not exist')) {
            console.warn('References table or chapter_id column does not exist yet.');
            setReferences([]);
            setLoading(false);
            return;
          }
          console.error('Error fetching references:', refsError);
          setReferences([]);
          setLoading(false);
          return;
        }

        if (refsData !== null) {
          const userIds = [...new Set(refsData.map((ref: any) => ref.user_id).filter(Boolean))];
          
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

          let userVerifications: string[] = [];
          if (currentUserId) {
            const { data: verifications } = await supabase
              .from('verifications')
              .select('reference_id')
              .eq('user_id', currentUserId);
            
            if (verifications) {
              userVerifications = verifications.map(v => v.reference_id);
            }
          }

          const referencesWithLinks = await Promise.all(
            refsData.map(async (ref: any) => {
              const { data: links } = await supabase
                .from('reference_links')
                .select('target_reference_id')
                .eq('source_reference_id', ref.id);

              let linkedRefs: Reference[] = [];
              if (links && links.length > 0) {
                const targetIds = links.map(l => l.target_reference_id);
                const { data: linkedRefsData } = await supabase
                  .from('references')
                  .select('id, timestamp, title, description, image_url, user_id, verified, verification_count, chapter_id')
                  .in('id', targetIds);

                if (linkedRefsData) {
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
    setTargetingMode(true);
    setPlaying(false);
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!targetingMode || !playerRef.current || !isReady) return;

    const currentTime = typeof playerRef.current.currentTime === "number" 
      ? Math.floor(playerRef.current.currentTime)
      : 0;

    setFormData({
      timestamp: currentTime,
      title: "",
      description: "",
      imageUrl: "https://via.placeholder.com/400x300/1f2937/9ca3af?text=רפרנס+חדש"
    });
    setTargetingMode(false);
    setShowAddForm(true);
  };

  const handleVideoMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!targetingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setCrosshairPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
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

      window.location.reload();
    } catch (err) {
      console.error('Error verifying:', err);
    }
  };

  const handleEditReference = () => {
    if (!selectedReference) return;
    setEditReferenceData({
      title: selectedReference.title,
      description: selectedReference.description,
      imageUrl: selectedReference.imageUrl
    });
    setIsEditingReference(true);
  };

  const handleSaveEditReference = async () => {
    if (!selectedReference || !user) return;
    
    if (!editReferenceData.title.trim()) {
      alert("אנא הכנס כותרת");
      return;
    }

    try {
      const { error } = await supabase
        .from('references')
        .update({
          title: editReferenceData.title,
          description: editReferenceData.description,
          image_url: editReferenceData.imageUrl
        })
        .eq('id', selectedReference.id);

      if (error) {
        alert('שגיאה בעריכה: ' + error.message);
        return;
      }

      const updatedReference = {
        ...selectedReference,
        title: editReferenceData.title,
        description: editReferenceData.description,
        imageUrl: editReferenceData.imageUrl
      };
      setSelectedReference(updatedReference);
      setReferences(references.map(ref => 
        ref.id === selectedReference.id ? updatedReference : ref
      ));
      setIsEditingReference(false);
      alert('הרפרנס עודכן בהצלחה!');
    } catch (err) {
      console.error('Error editing reference:', err);
      alert('שגיאה בלתי צפויה');
    }
  };

  const handleDeleteReference = async () => {
    if (!selectedReference || !user) return;
    
    if (!confirm("האם אתה בטוח שברצונך למחוק את הרפרנס הזה?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('references')
        .delete()
        .eq('id', selectedReference.id)
        .eq('user_id', user.id);

      if (error) {
        if (error.code === 'PGRST116') {
          alert("אתה לא יכול למחוק רפרנס שלא יצרת");
        } else {
          alert('שגיאה במחיקה: ' + error.message);
        }
        return;
      }

      setReferences(references.filter(ref => ref.id !== selectedReference.id));
      setSelectedReference(null);
      alert('הרפרנס נמחק בהצלחה!');
    } catch (err) {
      console.error('Error deleting reference:', err);
      alert('שגיאה בלתי צפויה');
    }
  };

  const handleAddLinkedReference = async () => {
    if (!selectedReference) return;
    
    setLoadingLinkedRefs(true);
    try {
      const { data: allRefs } = await supabase
        .from('references')
        .select('id, timestamp, title, description, image_url, user_id, verified, verification_count, chapter_id')
        .order('timestamp', { ascending: true });

      if (allRefs) {
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
        if (error.code === '23505') {
          alert("הרפרנס כבר מקושר");
        } else {
          alert("שגיאה בקישור רפרנס: " + error.message);
        }
        return;
      }

      alert("רפרנס מקושר בהצלחה!");
      setShowLinkedRefsModal(false);
      window.location.reload();
    } catch (err) {
      console.error('Error linking reference:', err);
      alert("שגיאה בלתי צפויה");
    }
  };

  const handleOpenLinkedReference = async (linkedRef: Reference) => {
    const url = `/chapter/${linkedRef.chapterId}?ref=${linkedRef.id}&time=${linkedRef.timestamp}`;
    window.open(url, '_blank');
  };

  const usernameToEmail = (username: string) => {
    let cleanUsername = username.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '');
    if (!cleanUsername) {
      cleanUsername = 'user' + Math.random().toString(36).substring(2, 9);
    }
    return `${cleanUsername}@yekumot.app`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginUsername.trim()) {
      setLoginMessage("אנא הכנס שם משתמש");
      return;
    }

    if (!loginPassword.trim()) {
      setLoginMessage("אנא הכנס סיסמה");
      return;
    }

    try {
      setLoginLoading(true);
      setLoginMessage("");

      const email = usernameToEmail(loginUsername);

      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: loginPassword,
      });

      if (error) {
        setLoginMessage('שגיאה בהתחברות: ' + error.message);
        return;
      }

      setShowLoginModal(false);
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

  if (!chapter && !loading) {
    return (
      <div className="min-h-screen bg-[#120e0b] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">פרק לא נמצא</p>
          <Link href="/" className="text-[#ec6d13] hover:underline">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !chapter) {
    return (
      <div className="min-h-screen bg-[#120e0b] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="spinner spinner-large mb-4 mx-auto"></div>
          <div className="text-xl">טוען פרק...</div>
        </div>
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div className="min-h-screen bg-[#120e0b] text-white pb-24">
      {/* Header */}
      <header className="app-bar flex items-center justify-between">
        <Link 
          href="/" 
          className="btn-icon"
        >
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
        <div className="flex-1 text-center px-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ec6d13]">עונה 1 • פרק</p>
          <h1 className="text-base font-bold leading-tight tracking-tight truncate">{chapter.title}</h1>
        </div>
        {user ? (
          <div className="relative group">
            <button className="btn-icon">
              {email.charAt(0).toUpperCase()}
            </button>
            <div className="absolute left-0 top-12 bg-[#1e1a17] border border-white/10 rounded-lg p-2 min-w-[180px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="px-3 py-2 text-sm border-b border-white/10">
                <div className="text-white/60 text-xs mb-1">מחובר כ:</div>
                <div className="text-white truncate">{email}</div>
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
          <button onClick={() => setShowLoginModal(true)} className="btn-icon">
            <span className="material-symbols-outlined">person</span>
          </button>
        )}
      </header>

      <main className="pb-24">
        {/* Video Player Section */}
        <section className="relative w-full bg-black">
          <div 
            className="aspect-video w-full bg-[#1e1a17] relative group overflow-hidden"
            style={{ cursor: targetingMode ? 'crosshair' : 'default' }}
            onClick={handleVideoClick}
            onMouseMove={handleVideoMouseMove}
          >
            {chapter.video_url ? (
              <ReactPlayer
                ref={playerRef}
                url={chapter.video_url}
                width="100%"
                height="100%"
                playing={playing}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onReady={() => setIsReady(true)}
                controls={!targetingMode}
                className="aspect-video"
                config={{
                  youtube: {
                    playerVars: {
                      modestbranding: 1,
                      rel: 0,
                    },
                  },
                }}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center">
                <span className="material-symbols-outlined text-[64px] text-white/20">movie</span>
              </div>
            )}
            
            {/* Targeting Mode Overlay */}
            {targetingMode && (
              <>
                <div 
                  className="absolute w-10 h-10 border border-white rounded-full pointer-events-none z-50"
                  style={{
                    left: `${crosshairPosition.x - 20}px`,
                    top: `${crosshairPosition.y - 20}px`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-px h-full bg-white" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-px w-full bg-white" />
                  </div>
                </div>
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#1e1a17] border border-[#ec6d13] px-4 py-2 rounded-lg text-[#ec6d13] text-sm font-bold">
                  מצב כיוון - לחץ על הווידאו להוספת רפרנס
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTargetingMode(false);
                  }}
                  className="absolute top-4 right-4 btn-secondary text-sm"
                >
                  ביטול
                </button>
              </>
            )}

            {/* Reference markers on timeline */}
            <div className="absolute bottom-0 left-0 right-0 h-6 z-10 pointer-events-none">
              {references.map((ref) => (
                <div
                  key={ref.id}
                  className="absolute bottom-2 w-3 h-3 bg-[#ec6d13] rounded-full animate-pulse"
                  style={{
                    left: `${Math.min((ref.timestamp / 600) * 100, 98)}%`,
                    transform: 'translateX(-50%)',
                  }}
                  title={ref.title}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Video Meta */}
        <section className="px-4 py-4 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold leading-tight">{chapter.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/50 text-xs font-medium">{references.length} רפרנסים</span>
              </div>
            </div>
            <button
              onClick={handleAddReferenceClick}
              disabled={!isReady || targetingMode}
              className="btn-primary text-sm"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              הוסף
            </button>
          </div>
          {chapter.description && (
            <p className="mt-3 text-white/60 text-sm leading-relaxed line-clamp-2">
              {chapter.description}
            </p>
          )}
        </section>

        {/* References Section */}
        <section className="mt-2">
          <div className="sticky top-[69px] z-30 bg-[#120e0b]/95 backdrop-blur-md pt-3 pb-2 px-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ec6d13] text-base">dataset</span>
                רפרנסים מפוענחים
              </h3>
              <span className="text-[10px] bg-[#1e1a17] text-white/50 px-2 py-0.5 rounded font-mono">שידור_חי</span>
            </div>
          </div>

          <div className="px-4 py-4 space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto" />
              </div>
            ) : references.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                אין רפרנסים עדיין. הוסף אחד כדי להתחיל!
              </div>
            ) : (
              references.map((ref) => (
                <div
                  key={ref.id}
                  onClick={() => handleReferenceClick(ref)}
                  className={`reference-card cursor-pointer ${selectedReference?.id === ref.id ? 'active' : ''}`}
                >
                  <button className="timestamp-btn">
                    <span className="text-[10px] font-bold uppercase">קפוץ</span>
                    <span>{formatTime(ref.timestamp)}</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm truncate">{ref.title}</h4>
                      {ref.verified && (
                        <span className="material-symbols-outlined text-green-500 text-base" title="מאומת">verified</span>
                      )}
                    </div>
                    {ref.description && (
                      <p className="text-white/50 text-xs mt-1 line-clamp-2">{ref.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="badge">
                        <span className="material-symbols-outlined text-[10px]">person</span>
                        {ref.username}
                      </span>
                      {ref.verificationCount !== undefined && ref.verificationCount > 0 && (
                        <span className="text-[10px] text-white/40">
                          {ref.verificationCount} אימותים
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Top Contributors */}
        <section className="mt-4 px-4 pb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">
              <span className="material-symbols-outlined text-[#ec6d13] text-base">military_tech</span>
              ארכיונאים מובילים
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {topContributors.map((contributor, index) => (
              <div key={contributor.id} className="flex flex-col items-center gap-1 shrink-0 w-16">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                    index === 0 ? 'bg-[#ec6d13] text-white border-2 border-[#ec6d13]' : 'bg-[#1e1a17] text-white/70 border-2 border-white/20'
                  }`}>
                    {contributor.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {index === 0 && (
                    <div className="absolute -bottom-1 -right-1 bg-[#1e1a17] rounded-full p-0.5">
                      <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-medium truncate w-full text-center ${index === 0 ? 'text-white' : 'text-white/50'}`}>
                  @{contributor.username}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FAB - Add Reference */}
      <button
        onClick={handleAddReferenceClick}
        disabled={!isReady || targetingMode}
        className="fab"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Add Reference Form Modal */}
      {showAddForm && user && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1a17] rounded-xl p-6 border border-white/10 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">הוסף רפרנס חדש</h2>
            <form onSubmit={handleSaveReference} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">זמן (נלכד מהוידאו)</label>
                <input
                  type="text"
                  value={formatTime(formData.timestamp)}
                  readOnly
                  className="input-field bg-white/5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">כותרת *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="input-field"
                  placeholder="הכנס כותרת רפרנס"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">תיאור</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="input-field"
                  placeholder="הכנס תיאור רפרנס"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'שומר...' : 'שמור רפרנס'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ timestamp: 0, title: "", description: "", imageUrl: "" });
                    setShowAddForm(false);
                  }}
                  className="btn-secondary flex-1"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reference Details Modal */}
      {selectedReference && !showAddForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
          <div className="bg-[#1e1a17] rounded-t-xl sm:rounded-xl p-6 border border-white/10 w-full sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{selectedReference.title}</h2>
                {selectedReference.verified && (
                  <span className="material-symbols-outlined text-green-500">verified</span>
                )}
              </div>
              <button
                onClick={() => setSelectedReference(null)}
                className="text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <p className="text-white/70 text-sm leading-relaxed mb-4">{selectedReference.description}</p>
            
            <div className="flex items-center gap-4 text-sm mb-4">
              <span className="font-mono bg-[#120e0b] px-3 py-1 rounded text-white/60">
                {formatTime(selectedReference.timestamp)}
              </span>
              <span className="text-white/50">
                נוסף על ידי: <span className="text-white font-medium">{selectedReference.username}</span>
              </span>
            </div>

            {/* Linked References */}
            {selectedReference.linkedReferences && selectedReference.linkedReferences.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-2 text-white/70">רפרנסים מקושרים:</h4>
                <div className="space-y-2">
                  {selectedReference.linkedReferences.map((linkedRef) => (
                    <button
                      key={linkedRef.id}
                      onClick={() => handleOpenLinkedReference(linkedRef)}
                      className="w-full text-right bg-[#120e0b] hover:bg-white/5 border border-white/10 rounded-lg p-3 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium text-sm">{linkedRef.title}</div>
                          <div className="text-xs text-white/50 mt-1">{formatTime(linkedRef.timestamp)}</div>
                        </div>
                        <span className="material-symbols-outlined text-[#26c6da]">open_in_new</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {user && selectedReference.userId && selectedReference.userId !== user.id && !selectedReference.hasUserVerified && !selectedReference.verified && (
                <button
                  onClick={() => handleVerify(selectedReference.id, selectedReference.userId || '')}
                  className="btn-success flex-1 text-sm"
                >
                  <span className="material-symbols-outlined text-sm">thumb_up</span>
                  אמת
                </button>
              )}
              {user && (
                <>
                  <button onClick={handleAddLinkedReference} className="btn-secondary flex-1 text-sm">
                    <span className="material-symbols-outlined text-sm">link</span>
                    קשר
                  </button>
                  <button onClick={handleEditReference} className="btn-secondary flex-1 text-sm">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    ערוך
                  </button>
                  {selectedReference.userId === user.id && (
                    <button onClick={handleDeleteReference} className="btn-danger flex-1 text-sm">
                      <span className="material-symbols-outlined text-sm">delete</span>
                      מחק
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Reference Modal */}
      {isEditingReference && selectedReference && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1a17] rounded-xl p-6 border border-white/10 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">ערוך רפרנס</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEditReference(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">כותרת *</label>
                <input
                  type="text"
                  value={editReferenceData.title}
                  onChange={(e) => setEditReferenceData({ ...editReferenceData, title: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">תיאור</label>
                <textarea
                  value={editReferenceData.description}
                  onChange={(e) => setEditReferenceData({ ...editReferenceData, description: e.target.value })}
                  rows={3}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">שמור שינויים</button>
                <button
                  type="button"
                  onClick={() => setIsEditingReference(false)}
                  className="btn-secondary flex-1"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1a17] rounded-xl p-6 border border-white/10 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">התחברות</h2>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginMessage("");
                }}
                className="text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">שם משתמש</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => {
                    setLoginUsername(e.target.value);
                    setLoginMessage("");
                  }}
                  placeholder="הכנס את שם המשתמש שלך"
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">סיסמה</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setLoginMessage("");
                  }}
                  placeholder="הכנס את הסיסמה שלך"
                  className="input-field"
                  required
                />
              </div>
              {loginMessage && (
                <p className={`text-sm ${loginMessage.includes("הצלח") ? "text-green-400" : "text-[#ef4444]"}`}>
                  {loginMessage}
                </p>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={loginLoading} className="btn-primary flex-1">
                  {loginLoading ? "מתחבר..." : "התחבר"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="btn-secondary flex-1"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1a17] rounded-xl p-6 border border-white/10 w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">בחר רפרנס לקישור</h2>
              <button
                onClick={() => {
                  setShowLinkedRefsModal(false);
                  setAvailableReferences([]);
                }}
                className="text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {loadingLinkedRefs ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto" />
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-2">
                {availableReferences.length === 0 ? (
                  <div className="text-center py-8 text-white/40">אין רפרנסים זמינים</div>
                ) : (
                  availableReferences.map((ref) => (
                    <button
                      key={ref.id}
                      onClick={() => handleLinkReference(ref.id)}
                      className="w-full text-right bg-[#120e0b] hover:bg-white/5 border border-white/10 rounded-lg p-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{ref.title}</div>
                          <div className="text-sm text-white/50 mt-1">
                            {formatTime(ref.timestamp)} • {ref.username}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[#26c6da]">link</span>
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
  );
}
