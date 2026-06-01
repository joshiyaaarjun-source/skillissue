import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, X, Trash2 } from "lucide-react";
import { useGetStories, getGetStoriesQueryKey, useCreateStory, useDeleteStory } from "@workspace/api-client-react";
import type { Story } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";

const MOODS = ["proud", "inspired", "energized", "struggling", "curious", "excited"];
const SKILLS = ["React", "Python", "Figma", "TypeScript", "Node.js", "Design", "General"];
const MOOD_EMOJI: Record<string, string> = { proud: "🎉", inspired: "✨", energized: "⚡", struggling: "😤", curious: "🤔", excited: "🚀" };

function StoryRing({ story, onClick }: { story: Story; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-shrink-0">
      <div className={`p-0.5 rounded-full ${story.isOwn ? "bg-gradient-to-br from-[#4d0011] to-[#bd7880]" : "bg-gradient-to-br from-[#bd7880] to-[#ffd9d9]"}`}>
        <div className="bg-background rounded-full p-0.5">
          <Avatar className="h-14 w-14">
            <AvatarImage src={story.authorAvatar} />
            <AvatarFallback className="text-sm bg-[#4d0011] text-white">{story.authorName[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <span className="text-[10px] font-semibold text-foreground max-w-[60px] truncate">{story.isOwn ? "You" : story.authorName.split(" ")[0]}</span>
    </button>
  );
}

function StoryViewer({ story, onClose, onDelete }: { story: Story; onClose: () => void; onDelete: () => void }) {
  const deleteStory = useDeleteStory();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    await deleteStory.mutateAsync({ id: String(story.id) });
    queryClient.invalidateQueries({ queryKey: getGetStoriesQueryKey() });
    onDelete();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm mx-4">
        <div className="relative bg-gradient-to-b from-[#4d0011]/30 to-[#102b1f]/30 rounded-3xl overflow-hidden border border-white/10">
          <div className="h-1.5 bg-white/20 mx-4 mt-4 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 5, ease: "linear" }}
              onAnimationComplete={onClose} className="h-full bg-white rounded-full" />
          </div>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={story.authorAvatar} />
                <AvatarFallback className="text-xs bg-[#4d0011] text-white">{story.authorName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white text-xs font-bold">{story.isOwn ? "You" : story.authorName}</p>
                <p className="text-white/50 text-[10px] flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{story.hoursLeft}h left</p>
              </div>
            </div>
            <div className="flex gap-2">
              {story.isOwn && (
                <button onClick={handleDelete} className="text-white/60 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button onClick={onClose} className="text-white/60">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="px-6 pb-6 pt-2 min-h-[200px] flex flex-col justify-center">
            {story.skill && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-white/10 text-white px-2.5 py-1 rounded-full font-bold">{story.skill}</span>
                {story.mood && <span className="text-lg">{MOOD_EMOJI[story.mood] ?? "✨"}</span>}
              </div>
            )}
            <p className="text-white text-base leading-relaxed font-medium">{story.content}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PostStoryModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ content: "", skill: "", mood: "" });
  const create = useCreateStory();
  const queryClient = useQueryClient();

  const submit = async () => {
    if (!form.content.trim()) return;
    await create.mutateAsync({ data: { content: form.content.trim(), skill: form.skill, mood: form.mood } });
    queryClient.invalidateQueries({ queryKey: getGetStoriesQueryKey() });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="w-full bg-background rounded-t-3xl p-5 pb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Share a Story</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />Disappears in 24 hours · Visible to matches only
        </p>
        <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="Share a win, a struggle, a moment from today's session..." rows={4}
          className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none resize-none mb-3" />
        <div className="flex flex-wrap gap-2 mb-3">
          {SKILLS.map(s => (
            <button key={s} onClick={() => setForm(f => ({ ...f, skill: f.skill === s ? "" : s }))}
              className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${form.skill === s ? "bg-[#4d0011] text-white border-[#4d0011]" : "border-border"}`}>{s}</button>
          ))}
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {MOODS.map(m => (
            <button key={m} onClick={() => setForm(f => ({ ...f, mood: f.mood === m ? "" : m }))}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0 transition-all ${form.mood === m ? "bg-[#bd7880] text-white border-[#bd7880]" : "border-border"}`}>
              {MOOD_EMOJI[m]} {m}
            </button>
          ))}
        </div>
        <button onClick={submit} disabled={!form.content.trim() || create.isPending}
          className="w-full bg-[#4d0011] text-white font-bold py-3.5 rounded-2xl disabled:opacity-50">
          {create.isPending ? "Posting..." : "Share Story ✨"}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function SkillStories() {
  const { data: stories, isLoading } = useGetStories({ query: { queryKey: getGetStoriesQueryKey() } });
  const [viewing, setViewing] = useState<Story | null>(null);
  const [showPost, setShowPost] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-lg">✨</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Skill Stories</h1>
              <p className="text-xs opacity-60">24-hour moments from your skill community</p>
            </div>
          </div>
          <button onClick={() => setShowPost(true)}
            className="flex items-center gap-1.5 bg-white/10 text-[#ffd9d9] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
            <Plus className="h-3.5 w-3.5" />Add
          </button>
        </div>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1,2,3,4,5].map(i => <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
              <div className="w-12 h-2.5 bg-muted animate-pulse rounded" />
            </div>)}
          </div>
        ) : !stories?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <span className="text-5xl">✨</span>
            <p className="font-medium mt-3">No stories yet</p>
            <p className="text-sm mt-1">Be the first to share today's moment</p>
          </div>
        ) : (
          <>
            <div className="flex gap-5 overflow-x-auto pb-4">
              {stories.map(story => <StoryRing key={story.id} story={story} onClick={() => setViewing(story)} />)}
            </div>
            <div className="mt-4 space-y-3">
              <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wide">Recent Stories</h2>
              {stories.map(story => (
                <motion.button key={story.id} onClick={() => setViewing(story)}
                  className="w-full bg-card border border-border rounded-2xl p-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-0.5 rounded-full bg-gradient-to-br from-[#bd7880] to-[#ffd9d9]">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={story.authorAvatar} />
                        <AvatarFallback className="text-xs bg-[#4d0011] text-white">{story.authorName[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{story.isOwn ? "You" : story.authorName}</span>
                        {story.skill && <span className="text-[10px] bg-[#ffd9d9]/60 text-[#4d0011] px-1.5 py-0.5 rounded-full font-bold">{story.skill}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{story.content}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3" />{story.hoursLeft}h
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {viewing && <StoryViewer story={viewing} onClose={() => setViewing(null)} onDelete={() => setViewing(null)} />}
        {showPost && <PostStoryModal onClose={() => setShowPost(false)} />}
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
