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
      // Skip main title
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
        
        // Fetch character
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
          
          // Increment view count
          await supabase.rpc('increment_view_count', {
            entity_type_param: 'character',
            entity_id_param: characterId
          });

          // Fetch connected references
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

      // Refresh references
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

      // Award points for editing
      await supabase.rpc('award_wiki_points', {
        user_id_param: user.id,
        points_to_add: 2,
        reason: 'עריכת דמות'
      });

      // Save to edit history
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
    
    // Check if user is the creator
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
        .eq('created_by', user.id); // רק היוצר יכול למחוק

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center" style={{ fontFamily: 'var(--font-heebo)' }}>
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: '#FFFFFF' }}>דמות לא נמצאה</p>
          <Link href="/characters" className="text-blue-400 hover:text-blue-300" style={{ fontFamily: 'var(--font-mono)' }}>
            חזרה לרשימת הדמויות
          </Link>
        </div>
      </div>
    );
  }

  const contentSections = parseContent(character.content);

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: 'var(--font-heebo)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/characters" className="wireframe-border px-3 py-1 mb-4 inline-block" style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
            ← חזרה לדמויות
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-4 glitch-text" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>
                {character.title}
              </h1>
              {character.description && (
                <p className="text-xl mb-4" style={{ color: '#FFFFFF', opacity: 0.7 }}>{character.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm" style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}>
                <span>{character.view_count || 0} צפיות</span>
              </div>
            </div>
            {user && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLinkRefModal(true);
                    fetchAvailableReferences();
                  }}
                  className="control-panel-btn"
                >
                  קשר רפרנס
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="control-panel-btn"
                >
                  {isEditing ? 'בטל עריכה' : 'ערוך'}
                </button>
                {character.created_by === user.id && (
                  <button
                    onClick={handleDeleteCharacter}
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
          {/* Main Content */}
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
                      setEditContent(character.content || '');
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
                {/* Content Sections */}
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

            {/* Connected References */}
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

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {character.image_url && (
              <div className="wireframe-border p-4 bg-transparent">
                <div className="relative aspect-square w-full">
                  <Image
                    src={character.image_url}
                    alt={character.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Reference Modal */}
      {showLinkRefModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" style={{ fontFamily: 'var(--font-heebo)' }}>
          <div className="wireframe-border p-6 bg-black w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>בחר רפרנס לקישור</h2>
              <button
                onClick={() => setShowLinkRefModal(false)}
                className="text-white hover:text-red-400 transition-colors"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                ✕
              </button>
            </div>
            {loadingRefs ? (
              <div className="text-center py-8" style={{ color: '#FFFFFF' }}>
                טוען רפרנסים...
              </div>
            ) : (
              <div className="space-y-2">
                {availableRefs.map((ref) => (
                  <button
                    key={ref.id}
                    onClick={() => handleLinkReference(ref.id)}
                    className="w-full text-right wireframe-border p-4 bg-transparent hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium mb-1" style={{ color: '#FFFFFF', fontFamily: 'var(--font-heebo)' }}>{ref.title}</div>
                        <div className="text-sm" style={{ color: '#008C9E', fontFamily: 'var(--font-mono)' }}>
                          {Math.floor(ref.timestamp / 60)}:{(ref.timestamp % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                      <svg className="w-5 h-5" style={{ color: '#008C9E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
