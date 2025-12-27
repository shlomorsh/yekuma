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
      const { data: refsData } = await supabase
        .from('references')
        .select('id, timestamp, title, chapter_id')
        .order('timestamp', { ascending: true });

      if (refsData) {
        // Get chapters for display
        const chapterIds = [...new Set(refsData.map(r => r.chapter_id).filter(Boolean))];
        const { data: chaptersData } = await supabase
          .from('chapters')
          .select('id, title')
          .in('id', chapterIds);

        const chaptersMap: Record<string, string> = {};
        if (chaptersData) {
          chaptersData.forEach(ch => {
            chaptersMap[ch.id] = ch.title;
          });
        }

        const refsWithChapters = refsData.map(ref => ({
          ...ref,
          chapter_title: ref.chapter_id ? chaptersMap[ref.chapter_id] : 'לא ידוע'
        }));

        // Filter out already linked references
        const linkedRefIds = references.map(r => r.id);
        setAvailableRefs(refsWithChapters.filter(r => !linkedRefIds.includes(r.id)));
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-zinc-400 mb-4">דמות לא נמצאה</p>
          <Link href="/characters" className="text-blue-400 hover:text-blue-300">
            חזרה לרשימת הדמויות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-500/10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/characters" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← חזרה לדמויות
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {character.title}
              </h1>
              {character.description && (
                <p className="text-xl text-zinc-400 mb-4">{character.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span>{character.view_count || 0} צפיות</span>
                {character.verified && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <span>⭐</span>
                    <span>מאומת</span>
                  </span>
                )}
              </div>
            </div>
            {user && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLinkRefModal(true);
                    fetchAvailableReferences();
                  }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  קשר רפרנס
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isEditing ? 'בטל עריכה' : 'ערוך'}
                </button>
                {character.created_by === user.id && (
                  <button
                    onClick={handleDeleteCharacter}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
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
          <div className="lg:col-span-2">
            {isEditing ? (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800">
                <h2 className="text-2xl font-bold mb-4">עריכת תוכן</h2>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={20}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="הכנס תוכן כאן..."
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSaveEdit}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    שמור
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(character.content || '');
                    }}
                    className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800">
                {character.content ? (
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: character.content }}
                  />
                ) : (
                  <p className="text-zinc-400">אין תוכן עדיין. {user && 'לחץ על "ערוך" כדי להוסיף תוכן.'}</p>
                )}
              </div>
            )}

            {/* Connected References */}
            {references.length > 0 && (
              <div className="mt-8 bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800">
                <h2 className="text-2xl font-bold mb-4">רפרנסים קשורים</h2>
                <div className="space-y-2">
                  {references.map((ref) => (
                    <Link
                      key={ref.id}
                      href={`/chapter/${ref.chapter_id}?ref=${ref.id}&time=${ref.timestamp}`}
                      target="_blank"
                      className="block bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg p-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{ref.title}</div>
                          <div className="text-sm text-zinc-400 mt-1">
                            {Math.floor(ref.timestamp / 60)}:{(ref.timestamp % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800 sticky top-8">
              {character.image_url ? (
                <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                  <Image
                    src={character.image_url}
                    alt={character.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gradient-to-br from-zinc-900 to-black rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-24 h-24 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-400 mb-2">מידע</h3>
                  <div className="text-sm text-zinc-300 space-y-1">
                    <div>נוצר: {new Date(character.created_at).toLocaleDateString('he-IL')}</div>
                    {character.updated_at && (
                      <div>עודכן: {new Date(character.updated_at).toLocaleDateString('he-IL')}</div>
                    )}
                  </div>
                </div>

                {character.links && character.links.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-400 mb-2">קישורים</h3>
                    <div className="space-y-1">
                      {character.links.map((link: any, index: number) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-blue-400 hover:text-blue-300"
                        >
                          {link.title || link.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Link Reference Modal */}
      {showLinkRefModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-6 shadow-2xl border border-zinc-800 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">בחר רפרנס לקישור</h2>
              <button
                onClick={() => setShowLinkRefModal(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {loadingRefs ? (
              <div className="text-center py-8 text-zinc-400">
                טוען רפרנסים...
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-2">
                {availableRefs.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400">
                    אין רפרנסים זמינים או שכולם כבר מקושרים
                  </div>
                ) : (
                  availableRefs.map((ref) => (
                    <button
                      key={ref.id}
                      onClick={() => handleLinkReference(ref.id)}
                      className="w-full text-right bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg p-4 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{ref.title}</div>
                          <div className="text-sm text-zinc-400 mt-1">
                            {ref.chapter_title} • {Math.floor(ref.timestamp / 60)}:{(ref.timestamp % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  );
}

