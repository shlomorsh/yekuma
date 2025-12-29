"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ImageUploader from "@/app/components/ImageUploader";

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
  
  const youtubePlayerRef = useRef<any>(null); // For YouTube IFrame API
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [videoDuration, setVideoDuration] = useState(600); // Default 10 minutes
  const [videoError, setVideoError] = useState<string | null>(null);
  const [youtubeAPIReady, setYoutubeAPIReady] = useState(false);
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [topContributors, setTopContributors] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLinkedRefsModal, setShowLinkedRefsModal] = useState(false);
  const [availableReferences, setAvailableReferences] = useState<Reference[]>([]);
  const [loadingLinkedRefs, setLoadingLinkedRefs] = useState(false);
  const [targetingMode, setTargetingMode] = useState(false);
  const [showAddReferenceGuide, setShowAddReferenceGuide] = useState(false);
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
        console.log('[Chapter] Starting to fetch chapter:', chapterId);
        setLoading(true);
        const startTime = Date.now();
        
        try {
          console.log('[Chapter] Making Supabase request...');
          
          // Add timeout to prevent hanging
          const fetchPromise = supabase
            .from('chapters')
            .select('id, title, description, video_url, image_url, order_index')
            .eq('id', chapterId)
            .single();
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Chapter fetch timeout after 10 seconds')), 10000);
          });
          
          const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
          
          console.log('[Chapter] Fetch completed in', Date.now() - startTime, 'ms');

          if (error) {
            console.error('[Chapter] Error fetching chapter:', {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
              chapterId: chapterId
            });
            setLoading(false);
            return;
          }

          if (data) {
            console.log('[Chapter] Setting chapter:', data.title);
            console.log('[Chapter] Video URL:', data.video_url);
            // Validate video URL
            if (data.video_url && !data.video_url.includes('youtube.com') && !data.video_url.includes('youtu.be')) {
              console.warn('[Chapter] Video URL does not appear to be a YouTube URL:', data.video_url);
            }
            setChapter(data);
            setLoading(false);
          } else {
            console.log('[Chapter] No chapter data found');
            setLoading(false);
          }
        } catch (err: any) {
          console.error('[Chapter] Fetch exception:', err);
          console.error('[Chapter] Exception details:', {
            message: err.message,
            name: err.name,
            stack: err.stack
          });
          // Set loading to false even on error
          setLoading(false);
          // Show error message to user
          if (err.message?.includes('timeout')) {
            console.error('[Chapter] Chapter fetch timed out - this might be a network issue');
          }
        }
      } catch (err) {
        console.error('[Chapter] Unexpected error:', err);
        setLoading(false);
      }
    };

    fetchChapter();
  }, [chapterId]);

  // No timeout needed - we use YouTube IFrame API directly

  // Video duration is set in YouTube IFrame API onReady event

  // Extract YouTube video ID for fallback
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined' || !chapter?.video_url) return;
    
    const videoId = getYouTubeVideoId(chapter.video_url);
    if (!videoId) return;

    // Check if YouTube API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      setYoutubeAPIReady(true);
      return;
    }

    // Load YouTube IFrame API script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Wait for API to be ready
    (window as any).onYouTubeIframeAPIReady = () => {
      console.log('[Chapter] YouTube IFrame API ready');
      setYoutubeAPIReady(true);
    };

    return () => {
      // Cleanup
      if ((window as any).onYouTubeIframeAPIReady) {
        delete (window as any).onYouTubeIframeAPIReady;
      }
    };
  }, [chapter?.video_url]);

  // Initialize YouTube Player when API is ready
  useEffect(() => {
    if (!youtubeAPIReady || !chapter?.video_url) return;
    if (!(window as any).YT || !(window as any).YT.Player) return;

    const videoId = getYouTubeVideoId(chapter.video_url);
    if (!videoId || youtubePlayerRef.current) return;

    try {
      youtubePlayerRef.current = new (window as any).YT.Player('youtube-player-iframe', {
        videoId: videoId,
        playerVars: {
          enablejsapi: 1,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
          autoplay: 0,
        },
        events: {
          onReady: (event: any) => {
            console.log('[Chapter] YouTube IFrame API player ready');
            try {
              const duration = event.target.getDuration();
              if (duration && duration > 0) {
                setVideoDuration(duration);
                setIsReady(true);
                setVideoError(null);
              }
            } catch (err) {
              console.warn('Could not get duration from YouTube API:', err);
            }
          },
          onStateChange: (event: any) => {
            // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
            if (event.data === 1) {
              setPlaying(true);
            } else if (event.data === 2) {
              setPlaying(false);
            }
          },
          onError: (event: any) => {
            console.error('[Chapter] YouTube player error:', event.data);
            setVideoError('שגיאה בטעינת הוידאו. נסה לרענן את הדף או לבדוק את הקישור.');
          },
        },
      });
    } catch (err) {
      console.error('Error initializing YouTube IFrame API player:', err);
      setVideoError('שגיאה באתחול נגן הוידאו. נסה לרענן את הדף.');
    }
  }, [youtubeAPIReady, chapter?.video_url]);

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
        // Seek to the timestamp using YouTube IFrame API
        if (youtubePlayerRef.current && typeof youtubePlayerRef.current.seekTo === 'function') {
          try {
            const time = parseInt(timeParam);
            youtubePlayerRef.current.seekTo(time, true);
            youtubePlayerRef.current.playVideo();
            setPlaying(true);
          } catch (err) {
            console.error('Error seeking to timestamp from URL:', err);
          }
        }
        // Clean URL
        router.replace(`/chapter/${chapterId}`, { scroll: false });
      }
    }
  }, [references, isReady, chapterId, router]);

  // Fetch references for this chapter
  useEffect(() => {
    const fetchReferences = async () => {
      if (!chapterId || !chapter) return;
      
      try {
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
            return;
          }
          console.error('Error fetching references:', {
            message: refsError.message,
            code: refsError.code,
            details: refsError.details,
            hint: refsError.hint
          });
          setReferences([]);
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
        setReferences([]);
      }
    };

    if (chapter) {
      fetchReferences();
    }
  }, [chapterId, user, chapter]);

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
    if (youtubePlayerRef.current && isReady) {
      try {
        // Seek using YouTube IFrame API
        if (typeof youtubePlayerRef.current.seekTo === 'function') {
          youtubePlayerRef.current.seekTo(reference.timestamp, true);
          youtubePlayerRef.current.playVideo();
          setPlaying(true);
        }
      } catch (err) {
        console.error('Error seeking to timestamp:', err);
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
      router.push("/login");
      return;
    }

    // Show guide modal first
    setShowAddReferenceGuide(true);
  };

  const handleStartTargeting = () => {
    // No need to check - we can always enable targeting mode
    // We'll get the time from either ReactPlayer or YouTube IFrame API
    setShowAddReferenceGuide(false);
    // "מצב כיוון" - מצב שבו המשתמש יכול ללחוץ על הוידאו כדי לבחור את הזמן המדויק להוספת רפרנס
    setTargetingMode(true);
    setPlaying(false);
  };

  const getCurrentTime = async (): Promise<number> => {
    // Use YouTube IFrame API
    if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
      try {
        const time = youtubePlayerRef.current.getCurrentTime();
        if (time && !isNaN(time) && time >= 0) {
          return Math.floor(time);
        }
      } catch (err) {
        console.error('Error getting current time from YouTube API:', err);
      }
    }
    
    return 0;
  };

  const handleVideoClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!targetingMode) return;
    
    // Prevent click if clicking on iframe directly
    if ((e.target as HTMLElement).tagName === 'IFRAME') {
      console.log('[Chapter] Clicked on iframe - trying to get time via API');
      // Don't return - try to get time anyway
    }

    const currentTime = await getCurrentTime();
    
    if (currentTime === 0 && !isReady) {
      // If we can't get time, show a message but still allow manual input
      const userConfirmed = confirm('לא ניתן לקבל את הזמן המדויק אוטומטית. האם תרצה להזין את הזמן ידנית?');
      if (!userConfirmed) {
        setTargetingMode(false);
        return;
      }
    }

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
        // כל משתמש מחובר יכול לערוך

      if (error) {
        alert('שגיאה בעריכה: ' + error.message);
        return;
      }

      // Update local state
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
        .eq('user_id', user.id); // רק היוצר יכול למחוק

      if (error) {
        if (error.code === 'PGRST116') {
          alert("אתה לא יכול למחוק רפרנס שלא יצרת");
        } else {
          alert('שגיאה במחיקה: ' + error.message);
        }
        return;
      }

      // Remove from local state
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

  if (loading && !chapter) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-xl mb-4" style={{ color: '#FFFFFF' }}>טוען פרק...</div>
        </div>
      </div>
    );
  }

  if (!loading && !chapter) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
        <div className="text-center">
          <div className="text-xl mb-4" style={{ color: '#FFFFFF' }}>פרק לא נמצא</div>
          <Link href="/" className="text-blue-400 hover:text-blue-300" style={{ fontFamily: 'var(--font-mono)' }}>
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
        <div className="text-center">
          <div className="text-xl mb-4" style={{ color: '#FFFFFF' }}>טוען פרק...</div>
        </div>
      </div>
    );
  }

  console.log('[Chapter] Rendering page with chapter:', {
    id: chapter.id,
    title: chapter.title,
    hasVideoUrl: !!chapter.video_url,
    videoUrl: chapter.video_url,
    referencesCount: references.length
  });

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-heebo)', position: 'relative', zIndex: 1 }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl" style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="wireframe-border px-3 py-1 transition-colors"
              style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}
            >
              ← חזרה לדף הבית
            </Link>
            <h1 className="text-2xl font-bold glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>{chapter.title}</h1>
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
                      className="w-10 h-10 wireframe-border flex items-center justify-center font-semibold hover:scale-110 transition-transform"
                      style={{ fontFamily: 'var(--font-mono)', color: '#FFFFFF', background: 'transparent' }}
                    >
                      {email.charAt(0).toUpperCase()}
                    </button>
                    <div className="absolute left-0 top-12 bg-black wireframe-border p-2 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="px-3 py-2 text-sm border-b" style={{ color: '#FFFFFF', borderColor: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                        {email}
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
              )
            )}
          </div>
        </div>

        {/* Chapter Description */}
        {chapter.description && (
          <div className="mb-6 wireframe-border p-4 bg-zinc-900/50">
            <p className="text-zinc-300 leading-relaxed" style={{ fontFamily: 'var(--font-heebo)' }}>
              {chapter.description}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Add Reference Button */}
            <div className="flex justify-end">
              <button
                onClick={handleAddReferenceClick}
                disabled={targetingMode}
                className={`control-panel-btn ${targetingMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {targetingMode ? 'מצב כיוון פעיל...' : 'הוסף רפרנס'}
              </button>
            </div>

            {/* Video Player */}
            <div 
              className="bg-black wireframe-border overflow-hidden relative aspect-video"
              style={{ cursor: targetingMode ? 'crosshair' : 'default' }}
              onClick={handleVideoClick}
              onMouseMove={handleVideoMouseMove}
            >
              {chapter.video_url ? (
                <>
                  {(() => {
                    const videoId = getYouTubeVideoId(chapter.video_url);
                    if (!videoId) {
                      return (
                        <div className="w-full h-full flex items-center justify-center bg-black">
                          <p className="text-red-400">שגיאה: לא ניתן לזהות את קישור הוידאו</p>
                        </div>
                      );
                    }
                    const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`;
                    return (
                      <div className="w-full h-full absolute inset-0">
                        <iframe
                          id="youtube-player-iframe"
                          ref={iframeRef}
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={chapter.title}
                          style={{ pointerEvents: targetingMode ? 'none' : 'auto' }}
                        />
                        {/* Overlay for targeting mode to capture clicks */}
                        {targetingMode && (
                          <div 
                            className="absolute inset-0 z-10"
                            style={{ pointerEvents: 'auto' }}
                          />
                        )}
                      </div>
                    );
                  })()}
                  {videoError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <div className="text-center p-4">
                        <p className="text-red-400 mb-2">{videoError}</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          רענן דף
                        </button>
                      </div>
                    </div>
                  )}
                  {!isReady && !videoError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                        <p className="text-white text-sm">טוען וידאו...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  <p className="text-zinc-400">אין קישור וידאו זמין</p>
                </div>
              )}
              
              {/* Targeting Mode Overlay */}
              {targetingMode && (
                <>
                  <div 
                    className="crosshair"
                    style={{
                      left: `${crosshairPosition.x}px`,
                      top: `${crosshairPosition.y}px`,
                    }}
                  />
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 wireframe-border px-4 py-2 bg-black" style={{ fontFamily: 'var(--font-mono)', color: '#FF6B00' }}>
                    מצב כיוון - לחץ על הווידאו להוספת רפרנס
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetingMode(false);
                    }}
                    className="absolute top-4 right-4 wireframe-border px-3 py-1 bg-black hover:bg-white/10 transition-colors"
                    style={{ fontFamily: 'var(--font-mono)', color: '#FFFFFF' }}
                  >
                    ביטול
                  </button>
                </>
              )}

              {/* Reference Pins - Blinking Red Dots */}
              {references.map((ref) => {
                // Calculate pin position based on timestamp and video duration
                const positionPercent = videoDuration > 0 
                  ? Math.min(100, Math.max(0, (ref.timestamp / videoDuration) * 100))
                  : 0;
                
                return (
                  <button
                    key={ref.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReferenceClick(ref);
                    }}
                    className="blink-red absolute bottom-4 cursor-pointer hover:scale-125 transition-transform"
                    style={{
                      left: `${positionPercent}%`,
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 10,
                      backgroundColor: selectedReference?.id === ref.id ? '#3b82f6' : '#ef4444',
                      border: '2px solid white',
                      pointerEvents: 'auto',
                    }}
                    title={`${ref.title} - ${formatTime(ref.timestamp)}`}
                  />
                );
              })}
            </div>

            {/* Add Reference Form */}
            {showAddForm && user && (
              <div className="terminal-style">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>הוסף רפרנס חדש</h2>
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
                      תמונה (אופציונלי)
                    </label>
                    <ImageUploader
                      value={formData.imageUrl}
                      onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                      aspectRatio={4/3}
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
                        setTargetingMode(false);
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
              <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-6 shadow-2xl border-2 border-zinc-800">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">פרטי רפרנס</h2>
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
                    {user && (
                      <>
                        <button
                          onClick={handleEditReference}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          <span>✏️</span>
                          <span>ערוך</span>
                        </button>
                        {selectedReference.userId === user.id && (
                          <button
                            onClick={handleDeleteReference}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
                          >
                            <span>🗑️</span>
                            <span>מחק</span>
                          </button>
                        )}
                      </>
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

            {/* Edit Reference Form */}
            {isEditingReference && selectedReference && (
              <div className="terminal-style">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>ערוך רפרנס</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleSaveEditReference(); }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      כותרת <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editReferenceData.title}
                      onChange={(e) => setEditReferenceData({ ...editReferenceData, title: e.target.value })}
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
                      value={editReferenceData.description}
                      onChange={(e) => setEditReferenceData({ ...editReferenceData, description: e.target.value })}
                      rows={4}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="הכנס תיאור רפרנס"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      כתובת תמונה
                    </label>
                    <input
                      type="url"
                      value={editReferenceData.imageUrl}
                      onChange={(e) => setEditReferenceData({ ...editReferenceData, imageUrl: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
                    >
                      שמור שינויים
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingReference(false);
                        setEditReferenceData({ title: "", description: "", imageUrl: "" });
                      }}
                      className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
                    >
                      ביטול
                    </button>
                  </div>
                </form>
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


        {/* Add Reference Guide Modal */}
        {showAddReferenceGuide && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black wireframe-border p-6 shadow-2xl w-full max-w-2xl mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
                  איך להוסיף רפרנס?
                </h2>
                <button
                  onClick={() => setShowAddReferenceGuide(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4 text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-orange-400" style={{ fontFamily: 'var(--font-mono)' }}>
                    שלב 1: בחר זמן בווידאו
                  </h3>
                  <p className="text-zinc-300">
                    לחץ על "התחל" למטה, ואז לחץ על הוידאו במקום שבו אתה רוצה להוסיף את הרפרנס.
                    הזמן המדויק יילכד אוטומטית.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-orange-400" style={{ fontFamily: 'var(--font-mono)' }}>
                    שלב 2: מלא פרטים
                  </h3>
                  <p className="text-zinc-300">
                    לאחר הלחיצה על הוידאו, ייפתח טופס שבו תוכל למלא:
                  </p>
                  <ul className="list-disc list-inside text-zinc-300 space-y-1 mr-4">
                    <li>כותרת (חובה)</li>
                    <li>תיאור (אופציונלי)</li>
                    <li>תמונה (אופציונלי)</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-orange-400" style={{ fontFamily: 'var(--font-mono)' }}>
                    שלב 3: שמור
                  </h3>
                  <p className="text-zinc-300">
                    לחץ על "שמור רפרנס" כדי לשמור את הרפרנס החדש.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleStartTargeting}
                    className="flex-1 control-panel-btn"
                  >
                    התחל
                  </button>
                  <button
                    onClick={() => setShowAddReferenceGuide(false)}
                    className="flex-1 wireframe-border px-4 py-2 bg-black hover:bg-white/10 transition-colors text-white"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    ביטול
                  </button>
                </div>
              </div>
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

