import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Radio, Clock, X, Zap, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useGetLiveDrops, getGetLiveDropsQueryKey, useCreateLiveDrop } from "@workspace/api-client-react";
import type { LiveDrop } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";

function CreateDropModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ skillTag: "", title: "", description: "", startsInMinutes: 10 });
  const createDrop = useCreateLiveDrop();
  const queryClient = useQueryClient();

  const submit = async () => {
    if (!form.skillTag || !form.title) return;
    await createDrop.mutateAsync({ data: form });
    queryClient.invalidateQueries({ queryKey: getGetLiveDropsQueryKey() });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full bg-background rounded-t-3xl p-5 pb-10"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Announce a Live Drop</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <input value={form.skillTag} onChange={e => setForm(f => ({...f, skillTag: e.target.value}))}
            placeholder="Skill tag (e.g. React)" className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none" />
          <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
            placeholder="Drop title (e.g. React hooks Q&A)" className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none" />
          <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))}
            placeholder="What will you cover?" rows={2} className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none resize-none" />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Starting in <strong>{form.startsInMinutes} minutes</strong></p>
            <input type="range" min={5} max={30} step={5} value={form.startsInMinutes}
              onChange={e => setForm(f => ({...f, startsInMinutes: parseInt(e.target.value)}))}
              className="w-full accent-[#102b1f]" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>5 min</span><span>30 min</span>
            </div>
          </div>
        </div>
        <button onClick={submit} disabled={createDrop.isPending || !form.skillTag || !form.title}
          className="mt-5 w-full bg-[#102b1f] text-white font-bold py-3.5 rounded-2xl disabled:opacity-40">
          {createDrop.isPending ? "Announcing..." : "🔴 Go Live"}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function LiveDrops() {
  const [, navigate] = useLocation();
  const { data: drops, isLoading } = useGetLiveDrops({ query: { queryKey: getGetLiveDropsQueryKey() } });
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <div className="bg-[#102b1f] text-white pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/explore")} className="flex items-center gap-1 text-white/60 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Radio className="h-5 w-5 text-white" />
              {drops && drops.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Live Drops</h1>
              <p className="text-xs opacity-60">Unplanned sessions happening now</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl">
            <Plus className="h-3.5 w-3.5" />
            Drop
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2].map(i => <div key={i} className="h-28 bg-muted/50 rounded-2xl animate-pulse" />)
        ) : drops?.map((drop, idx) => (
          <motion.div
            key={drop.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-[#102b1f] text-white rounded-2xl p-4 shadow-sm border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-green-500/5" />
            <div className="flex items-start gap-3">
              <div className="relative">
                <Avatar className="h-12 w-12 border-2 border-green-400/40">
                  <AvatarImage src={drop.hostAvatar} />
                  <AvatarFallback className="bg-[#4d0011] text-white font-bold">{drop.hostName[0]}</AvatarFallback>
                </Avatar>
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-[#102b1f] animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-[#4d0011] text-[#ffd9d9] px-2 py-0.5 rounded-full font-bold">{drop.skillTag}</span>
                  <span className="text-[10px] text-green-400 font-semibold flex items-center gap-0.5">
                    <Radio className="h-2.5 w-2.5 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <h3 className="font-bold text-sm leading-snug">{drop.title}</h3>
                {drop.description && <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{drop.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                  <span className="font-medium text-white/70">{drop.hostName}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{drop.minutesLeft}min left</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>in {drop.startsInMinutes}min</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="mt-3 w-full bg-green-500 text-white font-bold py-2 rounded-xl text-sm">
              Join Drop →
            </button>
          </motion.div>
        ))}

        {!isLoading && (!drops || drops.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <Radio className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No live drops right now</p>
            <p className="text-sm mt-1">Be the first to announce one!</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreate && <CreateDropModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
