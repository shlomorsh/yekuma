"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Character {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  links: any[];
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

export default function CharacterPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;
  const [character, setCharacter] = useState<Character | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showLinkRefModal, setShowLinkRefModal] = useState(false);
  const [availableRefs, setAvailableRefs] = useState<any[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);
  const [activeTab, setActiveTab] = useState<'biography' | 'references' | 'gallery'>('biography');

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
    const fetchCharacter = async () => {
      if (!characterId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('id', characterId)
          .single();

        if (error) {
          console.error('Error fetching character:', error);
          return;
        }

        if (data) {
          setCharacter(data);
          setEditContent(data.content || '');
          
          await supabase.rpc('increment_view_count', {
            entity_type_param: 'character',
            entity_id_param: characterId
          });

          const { data: refConnections } = await supabase
            .from('reference_connections')
            .select('reference_id')
            .eq('entity_type', 'character')
            .eq('entity_id', characterId);

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

    fetchCharacter();
  }, [characterId]);

  const fetchAvailableReferences = async () => {
    setLoadingRefs(true);
    try {
      const { data } = await supabase
        .from('references')
        .select('id, timestamp, title, chapter_id')
        .order('timestamp', { ascending: true });

      if (data) {
        setAvailableRefs(data);
      }
    } catch (err) {
      console.error('Error fetching references:', err);
    } finally {
      setLoadingRefs(false);
    }
  };

  const handleLinkReference = async (refId: string) => {
    if (!user || !character) return;

    try {
      const { error } = await supabase
        .from('reference_connections')
        .insert([{
          reference_id: refId,
          entity_type: 'character',
          entity_id: characterId,
          created_by: user.id
        }]);

      if (error) {
        if (error.code === '23505') {
          alert('הרפרנס כבר מקושר');
        } else {
          alert('שגיאה בקישור: ' + error.message);
        }
        return;
      }

      const { data: refConnections } = await supabase
        .from('reference_connections')
        .select('reference_id')
        .eq('entity_type', 'character')
        .eq('entity_id', characterId);

      if (refConnections) {
        const refIds = refConnections.map(c => c.reference_id);
        const { data: refsData } = await supabase
          .from('references')
          .select('id, timestamp, title, chapter_id')
          .in('id', refIds);

        if (refsData) {
          setReferences(refsData as Reference[]);
        }
      }

      setShowLinkRefModal(false);
      alert('רפרנס מקושר בהצלחה!');
    } catch (err) {
      console.error('Error linking reference:', err);
      alert('שגיאה בלתי צפויה');
    }
  };

  const handleSaveEdit = async () => {
    if (!user || !character) return;

    try {
      const { error } = await supabase
        .from('characters')
        .update({
          content: editContent,
          updated_by: user.id
        })
        .eq('id', characterId);

      if (error) {
        alert('שגיאה בשמירה: ' + error.message);
        return;
      }

      await supabase.rpc('award_wiki_points', {
        user_id_param: user.id,
        points_to_add: 2,
        reason: 'עריכת דמות'
      });

      await supabase
        .from('edit_history')
        .insert([{
          entity_type: 'character',
          entity_id: characterId,
          content: editContent,
          edited_by: user.id
        }]);

      setCharacter({ ...character, content: editContent });
      setIsEditing(false);
      alert('העריכה נשמרה בהצלחה! קיבלת 2 נקודות.');
    } catch (err) {
      console.error('Error saving edit:', err);
      alert('שגיאה בשמירה');
    }
  };

  const handleDeleteCharacter = async () => {
    if (!user || !character) return;
    
    if (character.created_by !== user.id) {
      alert("אתה יכול למחוק רק דמויות שיצרת");
      return;
    }

    if (!confirm("האם אתה בטוח שברצונך למחוק את הדמות הזו? פעולה זו לא ניתנת לביטול.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId)
        .eq('created_by', user.id);

      if (error) {
        if (error.code === 'PGRST116') {
          alert("אתה לא יכול למחוק דמות שלא יצרת");
        } else {
          alert('שגיאה במחיקה: ' + error.message);
        }
        return;
      }

      alert('הדמות נמחקה בהצלחה!');
      router.push('/characters');
    } catch (err) {
      console.error('Error deleting character:', err);
      alert('שגיאה בלתי צפויה');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#120e0b] text-white flex items-center justify-center">
        <div className="spinner spinner-large" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-[#120e0b] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">דמות לא נמצאה</p>
          <Link href="/characters" className="text-[#ec6d13] hover:underline">
            חזרה לרשימת הדמויות
          </Link>
        </div>
      </div>
    );
  }

  const contentSections = parseContent(character.content);

  return (
    <div className="min-h-screen bg-[#120e0b] text-white relative overflow-x-hidden pb-24">
      {/* Scanlines overlay */}
      <div className="scanlines fixed inset-0 z-50 opacity-20 pointer-events-none" />
      
      {/* Navigation Bar */}
      <nav className="app-bar flex items-center justify-between">
        <Link href="/characters" className="btn-icon">
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => {
                setShowLinkRefModal(true);
                fetchAvailableReferences();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#ec6d13]/10 hover:bg-[#ec6d13]/20 border border-[#ec6d13]/30 rounded-full transition-all"
            >
              <span className="material-symbols-outlined text-[#ec6d13] text-lg">link</span>
              <span className="text-[#ec6d13] text-sm font-bold">קשר</span>
            </button>
          )}
        </div>
      </nav>

      {/* Profile Header */}
      <header className="relative px-4 pt-6 pb-2">
        <div className="flex flex-col items-center">
          {/* Image Container with glow effect */}
          <div className="relative group cursor-pointer mb-6">
            <div className="absolute -inset-0.5 bg-gradient-to-l from-[#ec6d13] to-orange-600 rounded-xl opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative aspect-[3/4] w-40 rounded-xl bg-[#1e1a17] overflow-hidden border-2 border-[#ec6d13]/20">
              {character.image_url ? (
                <Image
                  src={character.image_url}
                  alt={character.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[64px] text-[#ec6d13]/30">person</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#120e0b] via-transparent to-transparent opacity-60" />
            </div>
            {/* Status Badge */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#1e1a17] border border-green-500/50 text-green-400 px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow-lg flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              חי
            </div>
          </div>
          
          <div className="text-center space-y-1 z-10">
            <h1 className="text-3xl font-extrabold tracking-tight retro-shadow uppercase">
              {character.title}
            </h1>
            {character.description && (
              <p className="text-[#ec6d13] font-medium tracking-wide text-xs uppercase opacity-90">
                {character.description}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 text-white/50 text-sm mt-2">
              <span className="material-symbols-outlined text-base">visibility</span>
              <span>{character.view_count || 0} צפיות</span>
              {character.verified && (
                <>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span className="material-symbols-outlined text-green-500 text-base">verified</span>
                  <span className="text-green-500">מאומת</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[69px] z-30 bg-[#120e0b] pt-2">
        <div className="tabs px-4">
          <button
            onClick={() => setActiveTab('biography')}
            className={`tab ${activeTab === 'biography' ? 'active' : ''}`}
          >
            ביוגרפיה
          </button>
          <button
            onClick={() => setActiveTab('references')}
            className={`tab ${activeTab === 'references' ? 'active' : ''}`}
          >
            אזכורים ({references.length})
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`tab ${activeTab === 'gallery' ? 'active' : ''}`}
          >
            גלריה
          </button>
        </div>
        <div className="h-4 bg-gradient-to-b from-[#120e0b] to-transparent opacity-50 pointer-events-none" />
      </div>

      <main className="flex flex-col gap-6 px-4 py-4 min-h-screen">
        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-3">
          <div className="stat-card">
            <div className="absolute top-0 left-0 p-1 opacity-20">
              <span className="material-symbols-outlined text-[#ec6d13] text-lg">fingerprint</span>
            </div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">סוג</p>
            <p className="text-white font-medium text-sm">דמות</p>
          </div>
          <div className="stat-card">
            <div className="absolute top-0 left-0 p-1 opacity-20">
              <span className="material-symbols-outlined text-[#ec6d13] text-lg">movie</span>
            </div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">הופעות</p>
            <p className="text-white font-medium text-sm">{references.length} רפרנסים</p>
          </div>
        </section>

        {/* Biography Tab */}
        {activeTab === 'biography' && (
          <>
            {isEditing ? (
              <section className="surface-card p-4">
                <h2 className="text-lg font-bold mb-4">עריכת תוכן</h2>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={15}
                  className="input-field font-mono text-sm"
                  placeholder="הכנס תוכן כאן..."
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={handleSaveEdit} className="btn-primary flex-1">שמור</button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(character.content || '');
                    }}
                    className="btn-secondary flex-1"
                  >
                    ביטול
                  </button>
                </div>
              </section>
            ) : (
              <section className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[#ec6d13] text-lg">terminal</span>
                  <h3 className="text-lg font-bold uppercase tracking-tight">יומן נתונים</h3>
                </div>
                
                {Object.keys(contentSections).length > 0 ? (
                  <div className="text-white/80 text-sm leading-relaxed space-y-4 bg-[#1e1a17]/30 p-4 rounded-lg border-r-2 border-[#ec6d13]/50">
                    {Object.entries(contentSections).map(([section, content]) => (
                      <div key={section}>
                        <h4 className="font-bold text-[#ec6d13] mb-2">{section}</h4>
                        {content.split('\n').map((line, i) => (
                          <p key={i} className="mb-2">{line}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : character.description ? (
                  <div className="text-white/80 text-sm leading-relaxed bg-[#1e1a17]/30 p-4 rounded-lg border-r-2 border-[#ec6d13]/50">
                    <p>{character.description}</p>
                  </div>
                ) : (
                  <div className="text-white/50 text-sm p-4">
                    אין תוכן עדיין. {user && 'לחץ על "ערוך" כדי להוסיף תוכן.'}
                  </div>
                )}

                {user && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary w-full"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    ערוך תוכן
                  </button>
                )}
              </section>
            )}
          </>
        )}

        {/* References Tab */}
        {activeTab === 'references' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ec6d13] text-lg">verified</span>
                <h3 className="text-lg font-bold uppercase tracking-tight">אזכורים מאומתים</h3>
              </div>
            </div>
            
            {references.length > 0 ? (
              <div className="space-y-3">
                {references.map((ref) => (
                  <Link
                    key={ref.id}
                    href={`/chapter/${ref.chapter_id}?ref=${ref.id}&time=${ref.timestamp}`}
                    target="_blank"
                    className="reference-card block"
                  >
                    <div className="shrink-0 mt-1">
                      <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium leading-snug">{ref.title}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="badge">{formatTime(ref.timestamp)}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-white/40 text-lg">chevron_left</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                אין רפרנסים מקושרים עדיין
              </div>
            )}

            {user && (
              <button
                onClick={() => {
                  setShowLinkRefModal(true);
                  fetchAvailableReferences();
                }}
                className="w-full py-3 text-xs font-bold text-white/50 uppercase tracking-widest hover:text-[#ec6d13] transition-colors border border-dashed border-white/20 hover:border-[#ec6d13]/50 rounded-lg"
              >
                + הוסף רפרנס
              </button>
            )}
          </section>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ec6d13] text-lg">image</span>
              <h3 className="text-lg font-bold uppercase tracking-tight">מאגר חזותי</h3>
            </div>
            
            {character.image_url ? (
              <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar -mx-4 px-4">
                <div className="relative shrink-0 w-60 aspect-video rounded-lg overflow-hidden border border-white/10 group">
                  <Image
                    src={character.image_url}
                    alt={character.title}
                    fill
                    className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                    <p className="text-white text-xs font-bold truncate">תמונה ראשית</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-white/40">
                אין תמונות עדיין
              </div>
            )}
          </section>
        )}
      </main>

      {/* FAB for editing */}
      {user && (
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="fab"
        >
          <span className="material-symbols-outlined text-[28px]">
            {isEditing ? 'close' : 'edit_note'}
          </span>
          {!isEditing && character.created_by === user.id && (
            <span className="absolute -top-1 -left-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#ef4444] border-2 border-[#120e0b]" />
            </span>
          )}
        </button>
      )}

      {/* Delete Button (only for creator) */}
      {user && character.created_by === user.id && (
        <button
          onClick={handleDeleteCharacter}
          className="fixed bottom-6 right-24 w-14 h-14 rounded-full bg-[#1e1a17] border border-[#ef4444]/30 text-[#ef4444] flex items-center justify-center hover:bg-[#ef4444]/10 transition-all z-30"
        >
          <span className="material-symbols-outlined text-[24px]">delete</span>
        </button>
      )}

      {/* Link Reference Modal */}
      {showLinkRefModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e1a17] rounded-xl p-6 border border-white/10 w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">בחר רפרנס לקישור</h2>
              <button
                onClick={() => setShowLinkRefModal(false)}
                className="text-white/50 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {loadingRefs ? (
              <div className="text-center py-8">
                <div className="spinner mx-auto" />
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-2">
                {availableRefs.length === 0 ? (
                  <div className="text-center py-8 text-white/40">אין רפרנסים זמינים</div>
                ) : (
                  availableRefs.map((ref) => (
                    <button
                      key={ref.id}
                      onClick={() => handleLinkReference(ref.id)}
                      className="w-full text-right bg-[#120e0b] hover:bg-white/5 border border-white/10 rounded-lg p-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{ref.title}</div>
                          <div className="text-sm text-white/50 mt-1">{formatTime(ref.timestamp)}</div>
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
