import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Handshake, Star, Clock, ShieldCheck, TrendingUp, Users, Coins, Video, Flag } from "lucide-react";
import {
  useGetMatches, getGetMatchesQueryKey,
  useGetExchanges, getGetExchangesQueryKey,
  useGetCreditBalance, getGetCreditBalanceQueryKey,
} from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";
import ExchangeModal from "@/components/ExchangeModal";
import ReportModal from "@/components/ReportModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ExploreUser } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";

function StatCard({ icon: Icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#bd7880]/15 p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-lg font-extrabold text-[#4d0011] leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Matches() {
  const [, navigate] = useLocation();
  const { data: matches, isLoading: matchesLoading } = useGetMatches({ query: { queryKey: getGetMatchesQueryKey() } });
  const { data: exchanges, isLoading: exchangesLoading } = useGetExchanges({ query: { queryKey: getGetExchangesQueryKey() } });
  const { data: credits } = useGetCreditBalance({ query: { queryKey: getGetCreditBalanceQueryKey() } });

  const [selectedPartner, setSelectedPartner] = useState<ExploreUser | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [reportTarget, setReportTarget] = useState<{ id: number; name: string } | null>(null);


  const isLoading = matchesLoading || exchangesLoading;

  const activeMatches = matches?.filter(m => m.status !== "completed") ?? [];
  const pastMatches = matches?.filter(m => m.status === "completed") ?? [];

  const getActiveExchange = (matchId: string) =>
    exchanges?.find(e => e.matchId === matchId && e.status === "active");

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#faf7f8] p-4 pt-12 space-y-4 pb-24">
        <Skeleton className="h-8 w-40 rounded-xl mb-6" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
        {[1, 2].map(i => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#faf7f8] pb-28">
      <div className="p-4 pt-12 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#4d0011]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Matches
          </h1>
          <p className="text-muted-foreground text-sm mt-1 italic">People ready to swap skills with you.</p>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard
            icon={Users}
            value={matches?.length ?? 0}
            label="Total Matches"
            color="bg-[#ffd9d9] text-[#4d0011]"
          />
          <StatCard
            icon={TrendingUp}
            value={credits?.totalEarned ?? 0}
            label="Credits Earned"
            color="bg-green-100 text-green-700"
          />
          <StatCard
            icon={Coins}
            value={credits?.totalSpent ?? 0}
            label="Credits Spent"
            color="bg-amber-100 text-amber-700"
          />
        </div>

        {/* Active Matches */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <h2 className="text-sm font-bold text-[#4d0011] uppercase tracking-wide">Active · {activeMatches.length}</h2>
          </div>

          {activeMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-[#bd7880]/30 p-8 text-center">
              <MessageCircle className="h-8 w-8 text-[#bd7880]/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active matches yet.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Keep swiping on the Explore page.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeMatches.map(match => {
                const activeExchange = getActiveExchange(match.id);
                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-[#bd7880]/12 shadow-sm overflow-hidden"
                  >
                    {/* Active exchange indicator bar */}
                    {activeExchange && (
                      <div className="bg-green-500 h-0.5 w-full" />
                    )}

                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-14 w-14 border-2 border-[#ffd9d9]">
                            <AvatarImage src={match.matchedUser.avatar} />
                            <AvatarFallback className="bg-[#bd7880] text-white font-bold text-lg">
                              {match.matchedUser.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          {match.matchedUser.verificationStatus === "fully_verified" && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                              <ShieldCheck size={10} className="text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-base text-[#4d0011] leading-none">{match.matchedUser.name}</h3>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Star size={11} className="text-yellow-500 fill-current" />
                                <span className="text-xs text-muted-foreground font-medium">{match.matchedUser.credibilityScore.toFixed(1)}</span>
                                <span className="text-muted-foreground/40 text-xs">·</span>
                                <Clock size={10} className="text-muted-foreground/60" />
                                <span className="text-xs text-muted-foreground/70">
                                  {formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                            </div>
                            {activeExchange ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-[#ffd9d9] text-[#4d0011] rounded-full border border-[#bd7880]/20">
                                Matched
                              </span>
                            )}
                          </div>

                          {/* Skill pair */}
                          {activeExchange && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs">
                              <span className="bg-[#bd7880] text-white px-2 py-0.5 rounded-full font-semibold">{activeExchange.teachSkill}</span>
                              <span className="text-muted-foreground/50">↔</span>
                              <span className="border border-[#bd7880]/40 text-[#4d0011] px-2 py-0.5 rounded-full font-semibold">{activeExchange.learnSkill}</span>
                            </div>
                          )}

                          {/* Overlapping skills */}
                          {!activeExchange && match.overlappingSkills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {match.overlappingSkills.slice(0, 3).map(s => (
                                <span key={s} className="text-[10px] bg-[#ffd9d9] text-[#4d0011] px-2 py-0.5 rounded-full font-semibold border border-[#bd7880]/20">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          className="w-full bg-[#102b1f] hover:bg-[#102b1f]/85 text-white font-bold rounded-xl h-9 gap-2"
                          onClick={() => navigate(`/session/${match.id}`)}
                        >
                          <Video size={14} /> Start Session
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                          <Link href={`/chat/${match.id}`} className="block">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-[#bd7880]/40 text-[#4d0011] hover:bg-[#ffd9d9]/40 font-bold rounded-xl h-9"
                            >
                              <MessageCircle size={14} className="mr-1.5" /> Message
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="w-full bg-[#4d0011] text-white hover:bg-[#4d0011]/85 font-bold rounded-xl h-9"
                            onClick={() => { setSelectedPartner(match.matchedUser); setSelectedMatchId(match.id); }}
                          >
                            <Handshake size={14} className="mr-1.5" /> Propose
                          </Button>
                        </div>
                        <button
                          onClick={() => setReportTarget({ id: parseInt(match.matchedUser.id), name: match.matchedUser.name })}
                          className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-destructive transition-colors"
                        >
                          <Flag size={10} />
                          Report user
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past Matches */}
        {pastMatches.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Past · {pastMatches.length}</h2>
            </div>
            <div className="space-y-3">
              {pastMatches.map(match => {
                const ex = exchanges?.find(e => e.matchId === match.id && e.status === "completed");
                return (
                  <div key={match.id} className="bg-white/60 rounded-2xl border border-border p-4 opacity-80">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={match.matchedUser.avatar} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold">
                          {match.matchedUser.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{match.matchedUser.name}</p>
                        {ex && (
                          <p className="text-xs text-muted-foreground">
                            {ex.teachSkill} ↔ {ex.learnSkill}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                        Completed
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <ExchangeModal
        isOpen={!!selectedPartner}
        onClose={() => setSelectedPartner(null)}
        partner={selectedPartner}
        matchId={selectedMatchId}
      />

      {reportTarget && (
        <ReportModal
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          reportedUserId={reportTarget.id}
          reportedUserName={reportTarget.name}
        />
      )}

      <BottomNav />
    </div>
  );
}
