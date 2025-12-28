"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  view_count: number;
  verified: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface Reference {
  id: string;
  timestamp: number;
  title: string;
  chapter_id: string;
}

// Parse markdown content to extract sections
function parseContent(content: string | null) {
  if (!content) return {};
  
  const sections: Record<string, string> = {};
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      currentSection = line.replace('## ', '').trim();
      currentContent = [];
    } else if (line.startsWith('# ')) {
      continue;
    } else if (line.trim()) {
      currentContent.push(line.trim());
    }
  }
  
  if (currentSection) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  return sections;
}

export default function AdvertisementPage() {
  const params = useParams();
  const router = useRouter();
  const advertisementId = params.id as string;
  const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

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
    const fetchAdvertisement = async () => {
      if (!advertisementId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('advertisements')
          .select('*')
          .eq('id', advertisementId)
          .single();

        if (error) {
          console.error('Error fetching advertisement:', error);
          setLoading(false);
          return;
        }

        if (data) {
          setAdvertisement(data);
          setEditContent(data.content || '');
          
          await supabase.rpc('increment_view_count', {
            entity_type_param: 'advertisement',
            entity_id_param: advertisementId
          });

          const { data: refConnections } = await supabase
            .from('reference_connections')
            .select('reference_id')
            .eq('entity_type', 'advertisement')
            .eq('entity_id', advertisementId);

          if (refConnections && refConnections.length > 0) {
            const refIds = refConnections.map(c => c.reference_id);
            const { data: refsData } = await supabase
              .from('references')
              .select('id, timestamp, title, chapter_id')
              .in('id', refIds);

            if (refsData) {
              setReferences(refsData as Reference[]);
            }
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvertisement();
  }, [advertisementId]);

  const handleSaveEdit = async () => {
    if (!user || !advertisement) return;

    try {
      const { error } = await supabase
        .from('advertisements')
        .update({
          content: editContent,
          updated_by: user.id
        })
        .eq('id', advertisementId);

      if (error) {
        alert('שגיאה בשמירה: ' + error.message);
        return;
      }

      await supabase.rpc('award_wiki_points', {
        user_id_param: user.id,
        points_to_add: 2,
        reason: 'עריכת פרסומת'
      });

      setAdvertisement({ ...advertisement, content: editContent });
      setIsEditing(false);
      alert('העריכה נשמרה בהצלחה! קיבלת 2 נקודות.');
    } catch (err) {
      console.error('Error saving edit:', err);
      alert('שגיאה בשמירה');
    }
  };

  const handleDeleteAdvertisement = async () => {
    if (!user || !advertisement) return;
    
    if (advertisement.created_by !== user.id) {
      alert("אתה יכול למחוק רק פרסומות שיצרת");
      return;
    }

    if (!confirm("האם אתה בטוח שברצונך למחוק את הפרסומת הזו? פעולה זו לא ניתנת לביטול.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', advertisementId)
        .eq('created_by', user.id);

      if (error) {
        alert('שגיאה במחיקה: ' + error.message);
        return;
      }

      alert('הפרסומת נמחקה בהצלחה!');
      router.push('/advertisements');
    } catch (err) {
      console.error('Error deleting advertisement:', err);
      alert('שגיאה בלתי צפויה');
    }
  };

  if (loading && !advertisement) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <div className="text-xl mb-4" style={{ color: '#FFFFFF' }}>טוען פרסומת...</div>
        </div>
      </div>
    );
  }

  if (!loading && !advertisement) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
        <div className="text-center">
          <div className="text-xl mb-4" style={{ color: '#FFFFFF' }}>פרסומת לא נמצאה</div>
          <Link href="/advertisements" className="text-blue-400 hover:text-blue-300" style={{ fontFamily: 'var(--font-mono)' }}>
            חזרה לרשימת הפרסומות
          </Link>
        </div>
      </div>
    );
  }

  const contentSections = parseContent(advertisement.content);

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Link href="/advertisements" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
            ← חזרה לפרסומות
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-4 glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                {advertisement.title}
              </h1>
              {advertisement.description && (
                <p className="text-xl mb-4" style={{ color: '#FFFFFF', opacity: 0.7 }}>{advertisement.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm" style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}>
                <span>{advertisement.view_count || 0} צפיות</span>
                {advertisement.verified && (
                  <span className="flex items-center gap-1" style={{ color: '#FF6B00' }}>
                    <span>⭐</span>
                    <span>מאומת</span>
                  </span>
                )}
              </div>
            </div>
            {user && (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="control-panel-btn"
                >
                  {isEditing ? 'בטל עריכה' : 'ערוך'}
                </button>
                {advertisement.created_by === user.id && (
                  <button
                    onClick={handleDeleteAdvertisement}
                    className="wireframe-border px-6 py-3 bg-black text-red-400 hover:bg-red-400/10 transition-colors"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    🗑️ מחק
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {isEditing ? (
              <div className="wireframe-border p-6 bg-transparent">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>עריכת תוכן</h2>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={20}
                  className="w-full bg-black wireframe-border px-4 py-2 text-white focus:outline-none resize-none"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  placeholder="הכנס תוכן כאן..."
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="control-panel-btn"
                  >
                    שמור
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(advertisement.content || '');
                    }}
                    className="wireframe-border px-6 py-2 bg-black text-white hover:bg-white/10 transition-colors"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {advertisement.image_url && (
                  <div className="wireframe-border p-4 bg-transparent">
                    <div className="relative aspect-square w-full max-w-md mx-auto">
                      <Image
                        src={advertisement.image_url}
                        alt={advertisement.title}
                        fill
                        className="object-cover"
                        unoptimized={advertisement.image_url.includes('youtube.com') || advertisement.image_url.includes('img.youtube.com')}
                      />
                    </div>
                  </div>
                )}

                {Object.keys(contentSections).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(contentSections).map(([section, content]) => (
                      <div key={section} className="wireframe-border p-6 bg-transparent">
                        <h2 className="text-2xl font-bold mb-4 glitch-text" style={{ color: '#FF6B00', fontFamily: 'var(--font-heebo)' }}>
                          {section}
                        </h2>
                        <div className="space-y-3" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                          {content.split('\n').map((line, i) => (
                            <p key={i} style={{ opacity: 0.9, lineHeight: '1.8' }}>
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wireframe-border p-6 bg-transparent">
                    <p style={{ color: '#FFFFFF', opacity: 0.7, fontFamily: 'var(--font-heebo)' }}>
                      אין תוכן עדיין. {user && 'לחץ על "ערוך" כדי להוסיף תוכן.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {references.length > 0 && (
              <div className="wireframe-border p-6 bg-transparent">
                <h2 className="text-2xl font-bold mb-4 glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                  רפרנסים קשורים
                </h2>
                <div className="space-y-2">
                  {references.map((ref) => (
                    <Link
                      key={ref.id}
                      href={`/chapter/${ref.chapter_id}?ref=${ref.id}&time=${ref.timestamp}`}
                      target="_blank"
                      className="block wireframe-border p-4 bg-transparent hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium mb-1" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>{ref.title}</div>
                          <div className="text-sm" style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}>
                            {Math.floor(ref.timestamp / 60)}:{(ref.timestamp % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                        <svg className="w-5 h-5" style={{ color: '#008C9E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {advertisement.image_url && (
              <div className="wireframe-border p-4 bg-transparent">
                <div className="relative aspect-square w-full">
                  <Image
                    src={advertisement.image_url}
                    alt={advertisement.title}
                    fill
                    className="object-cover"
                    unoptimized={advertisement.image_url.includes('youtube.com') || advertisement.image_url.includes('img.youtube.com')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

