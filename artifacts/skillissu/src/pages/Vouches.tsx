import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Star, Plus, X } from "lucide-react";
import { useLocation } from "wouter";
import { useGetVouches, getGetVouchesQueryKey, useCreateVouch } from "@workspace/api-client-react";
import type { Vouch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";

function VouchModal({ targetUserId, onClose }: { targetUserId: string; onClose: () => void }) {
  const [skill, setSkill] = useState("");
  const [error, setError] = useState("");
  const createVouch = useCreateVouch();
  const queryClient = useQueryClient();

  const submit = async () => {
    setError("");
    if (!skill.trim()) { setError("Enter a skill to endorse"); return; }
    try {
      await createVouch.mutateAsync({ data: { vouchedUserId: parseInt(targetUserId), skill: skill.trim() } });
      queryClient.invalidateQueries({ queryKey: getGetVouchesQueryKey(targetUserId) });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to vouch");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="w-full bg-background rounded-t-3xl p-5 pb-10"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Stake Your Reputation</h2>
          <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>

        <div className="bg-[#ffd9d9]/30 rounded-2xl p-4 mb-5 border border-[#ffd9d9]/50">
          <p className="text-sm text-[#4d0011] leading-relaxed font-medium">
            5 credits are staked when you vouch. If the person underperforms, your stake is at risk.
          </p>
        </div>

        <div className="space-y-3">
          <input
            value={skill}
            onChange={e => setSkill(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Skill to endorse (e.g. React, Python, Design)"
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none"
          />
        </div>

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

        <button
          onClick={submit}
          disabled={createVouch.isPending || !skill.trim()}
          className="mt-5 w-full bg-[#4d0011] text-white font-bold py-3.5 rounded-2xl text-base disabled:opacity-50"
        >
          {createVouch.isPending ? "Staking..." : "Stake 5C & Vouch"}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Vouches({ userId }: { userId?: string }) {
  const [, navigate] = useLocation();
  const targetId = userId ?? "1";
  const { data: vouches, isLoading } = useGetVouches(targetId, { query: { queryKey: getGetVouchesQueryKey(targetId) } });
  const [showVouchModal, setShowVouchModal] = useState(false);

  const totalStaked = vouches?.reduce((sum, v) => sum + v.stakeAmount, 0) ?? 0;
  const reputationScore = Math.min(100, (vouches?.length ?? 0) * 15 + totalStaked * 2);

  const TIER_INFO = reputationScore >= 80
    ? { label: "Trusted Expert", color: "text-yellow-600", bg: "bg-yellow-100" }
    : reputationScore >= 40
    ? { label: "Credible Teacher", color: "text-[#102b1f]", bg: "bg-[#102b1f]/10" }
    : { label: "Building Trust", color: "text-[#bd7880]", bg: "bg-[#ffd9d9]/40" };

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-1 text-[#ffd9d9]/60 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />Back to Profile
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-[#ffd9d9]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Reputation Staking</h1>
              <p className="text-xs opacity-60">Peer vouches with real skin in the game</p>
            </div>
          </div>
          <button
            onClick={() => setShowVouchModal(true)}
            className="flex items-center gap-1.5 bg-white/10 text-[#ffd9d9] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Vouch
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Reputation score card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 flex items-center gap-5">
          <div className="relative">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#ffd9d9" strokeWidth="5" />
              <circle cx="28" cy="28" r="22" fill="none" stroke="#4d0011" strokeWidth="5"
                strokeDasharray={`${(reputationScore / 100) * 138} 138`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-black text-[#4d0011]">
              {Math.round(reputationScore)}
            </span>
          </div>
          <div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TIER_INFO.bg} ${TIER_INFO.color}`}>
              {TIER_INFO.label}
            </span>
            <p className="text-sm text-muted-foreground mt-2">{vouches?.length ?? 0} vouches · {totalStaked}C total staked</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalStaked} credits are backing your reputation
            </p>
          </div>
        </motion.div>

        {/* Vouches list */}
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />)
        ) : !vouches || vouches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No vouches yet</p>
            <p className="text-sm mt-1">Be the first to vouch for this person</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vouches.map((vouch: Vouch, idx: number) => (
              <motion.div
                key={vouch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="bg-card border border-border rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={vouch.voucherAvatar} />
                    <AvatarFallback className="text-xs bg-[#4d0011] text-white">{vouch.voucherName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-semibold text-sm">{vouch.voucherName}</span>
                      <span className="text-[10px] bg-[#4d0011]/10 text-[#4d0011] px-2 py-0.5 rounded-full font-bold">{vouch.skill}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${vouch.status === "active" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {vouch.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#4d0011]/10 flex items-center justify-center">
                          <span className="text-[#4d0011] text-[9px] font-black">{vouch.stakeAmount}</span>
                        </div>
                        <span>{vouch.stakeAmount}C staked</span>
                      </div>
                      <span>·</span>
                      <span>Endorsed for <strong className="text-foreground">{vouch.skill}</strong></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showVouchModal && <VouchModal targetUserId={targetId} onClose={() => setShowVouchModal(false)} />}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
