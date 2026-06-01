import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, Plus, X, Send, Crown } from "lucide-react";
import {
  useGetMarketplaceChallenges, getGetMarketplaceChallengesQueryKey,
  useCreateMarketplaceChallenge, useSubmitMarketplaceSolution, usePickMarketplaceWinner
} from "@workspace/api-client-react";
import type { MarketplaceChallenge } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import BottomNav from "@/components/BottomNav";

const SKILLS = ["React", "TypeScript", "Python", "Figma", "Node.js", "UI Design"];

function PostModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", skill: "", bounty: 10 });
  const create = useCreateMarketplaceChallenge();
  const queryClient = useQueryClient();

  const submit = async () => {
    if (!form.title || !form.description || !form.skill) return;
    await create.mutateAsync({ data: { title: form.title, description: form.description, skill: form.skill, bounty: form.bounty } });
    queryClient.invalidateQueries({ queryKey: getGetMarketplaceChallengesQueryKey() });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="w-full bg-background rounded-t-3xl p-5 pb-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Post a Challenge</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Challenge title" className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe the task in detail..." rows={4}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none resize-none" />
          <div className="grid grid-cols-3 gap-2">
            {SKILLS.map(s => (
              <button key={s} onClick={() => setForm(f => ({ ...f, skill: s }))}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${form.skill === s ? "bg-[#4d0011] text-white border-[#4d0011]" : "border-border"}`}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Bounty:</span>
            {[5, 10, 15, 20, 30, 50].map(b => (
              <button key={b} onClick={() => setForm(f => ({ ...f, bounty: b }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${form.bounty === b ? "bg-[#4d0011] text-white border-[#4d0011]" : "border-border"}`}>{b}C</button>
            ))}
          </div>
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          {form.bounty}C will be held in escrow. Refunded if no winner is chosen within 72h.
        </div>
        <button onClick={submit} disabled={!form.title || !form.description || !form.skill || create.isPending}
          className="mt-4 w-full bg-[#4d0011] text-white font-bold py-3.5 rounded-2xl disabled:opacity-50">
          {create.isPending ? "Posting..." : `Post Challenge (${form.bounty}C escrow)`}
        </button>
      </motion.div>
    </motion.div>
  );
}

function ChallengeCard({ challenge }: { challenge: MarketplaceChallenge }) {
  const [showSubmit, setShowSubmit] = useState(false);
  const [solution, setSolution] = useState("");
  const submit = useSubmitMarketplaceSolution();
  const pickWinner = usePickMarketplaceWinner();
  const queryClient = useQueryClient();

  const expiresIn = Math.max(0, Math.round((new Date(challenge.expiresAt).getTime() - Date.now()) / 3600000));
  const isOwn = challenge.posterId === 1;

  const handleSubmit = async () => {
    if (!solution.trim()) return;
    await submit.mutateAsync({ id: String(challenge.id), data: { solution } });
    setSolution("");
    setShowSubmit(false);
    queryClient.invalidateQueries({ queryKey: getGetMarketplaceChallengesQueryKey() });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-[#4d0011]/10 text-[#4d0011] px-2 py-0.5 rounded-full font-bold">{challenge.skill}</span>
            <span className="text-[10px] text-muted-foreground">{expiresIn}h left</span>
          </div>
          <h3 className="font-bold text-sm">{challenge.title}</h3>
        </div>
        <div className="flex items-center gap-1 bg-amber-100 px-2.5 py-1 rounded-xl ml-2">
          <Trophy className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-black text-amber-700">{challenge.bounty}C</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{challenge.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{challenge.submissionCount} submission{challenge.submissionCount !== 1 ? "s" : ""}</span>
        {!isOwn && challenge.status === "open" && (
          challenge.mySubmission ? (
            <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Trophy className="h-3 w-3" />Submitted</span>
          ) : (
            <button onClick={() => setShowSubmit(v => !v)} className="text-xs bg-[#4d0011] text-white font-bold px-3 py-1.5 rounded-xl">
              {showSubmit ? "Cancel" : "Submit Solution"}
            </button>
          )
        )}
        {isOwn && <span className="text-xs text-muted-foreground italic">Your challenge</span>}
      </div>
      <AnimatePresence>
        {showSubmit && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3 pt-3 border-t border-border">
            <textarea value={solution} onChange={e => setSolution(e.target.value)}
              placeholder="Write your solution here..." rows={3}
              className="w-full bg-muted rounded-xl px-3 py-2 text-sm outline-none resize-none mb-2" />
            <button onClick={handleSubmit} disabled={!solution.trim() || submit.isPending}
              className="w-full bg-[#102b1f] text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              <Send className="h-4 w-4" />{submit.isPending ? "Submitting..." : "Submit"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function SkillChallengesMarketplace() {
  const { data: challenges, isLoading } = useGetMarketplaceChallenges({ query: { queryKey: getGetMarketplaceChallengesQueryKey() } });
  const [showPost, setShowPost] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Challenges</h1>
              <p className="text-xs opacity-60">Real tasks. Real bounties. 72h to win.</p>
            </div>
          </div>
          <button onClick={() => setShowPost(true)}
            className="flex items-center gap-1.5 bg-white/10 text-[#ffd9d9] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
            <Plus className="h-3.5 w-3.5" />Post
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? [1,2,3].map(i => <div key={i} className="h-32 bg-muted/50 rounded-2xl animate-pulse" />) :
          challenges?.map(c => <ChallengeCard key={c.id} challenge={c} />)}
      </div>

      <AnimatePresence>{showPost && <PostModal onClose={() => setShowPost(false)} />}</AnimatePresence>
      <BottomNav />
    </div>
  );
}
