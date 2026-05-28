import { useState, useEffect } from "react";
import { useGetMe, getGetMeQueryKey, useGetExchanges, getGetExchangesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Star, CheckCircle, Upload, Copy, Check, Gift, Users, ShieldCheck as ShieldCheckIcon, Crown, ArrowRight, ArrowLeft, Dna, Shield } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CreditCounter from "@/components/CreditCounter";
import PortfolioSection from "@/components/PortfolioSection";

type ReferralData = {
  code: string;
  inviteLink: string;
  referralCount: number;
  creditsEarned: number;
  rewardPerReferral: number;
  message: string;
};

export default function Profile() {
  const queryClient = useQueryClient();
  const { data: me, isLoading: meLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: exchanges, isLoading: exchangesLoading } = useGetExchanges({ query: { queryKey: getGetExchangesQueryKey() } });
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  useEffect(() => {
    fetch("/api/referral").then(r => r.json()).then(setReferral).catch(() => {});
  }, []);

  const copyLink = () => {
    if (!referral) return;
    navigator.clipboard.writeText(referral.inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const redeemReferral = async () => {
    if (!redeemCode.trim()) return;
    setRedeemLoading(true);
    setRedeemMsg(null);
    try {
      const r = await fetch("/api/referral/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await r.json() as { message?: string; error?: string };
      setRedeemMsg(data.message ?? data.error ?? "Done");
      if (r.ok) {
        setRedeemCode("");
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    } finally {
      setRedeemLoading(false);
    }
  };

  if (meLoading || exchangesLoading) {
    return (
      <div className="min-h-[100dvh] p-4 pt-12 space-y-6 pb-24">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!me) return null;

  const activeExchange = exchanges?.find(e => e.status === 'active');
  const isElite = me.credibilityScore >= 4.5 && me.totalExchanges >= 5;

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-8 px-4 rounded-b-[2rem] shadow-md relative">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 border-4 border-white/20 shadow-lg mb-4">
            <AvatarImage src={me.avatar} />
            <AvatarFallback className="bg-[#bd7880] text-white font-bold text-3xl">
              {me.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold">{me.name}</h1>
            {isElite && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-2 py-0.5 rounded-full">
                <Crown className="h-3 w-3 fill-current" />
                Elite
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[#ffd9d9] mb-4">
            <Star className="h-5 w-5 fill-current" />
            <span className="font-bold text-lg">{me.credibilityScore.toFixed(1)}</span>
            <span className="text-sm opacity-80 ml-1">credibility score</span>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 w-full max-w-xs backdrop-blur-sm border border-white/10">
            <div className="text-sm font-medium opacity-80 uppercase tracking-wider mb-1">Credit Balance</div>
            <div className="text-4xl font-black flex items-center justify-center gap-2">
              <CreditCounter value={me.creditBalance} />
              <span className="text-xl">C</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-8 mt-4">
        {activeExchange && (
          <div className="bg-card border-2 border-primary rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
            <h3 className="text-sm font-bold text-primary mb-1 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Active Exchange
            </h3>
            <p className="font-medium text-lg">Ongoing - Partner: {activeExchange.partnerName}</p>
            <p className="text-muted-foreground text-sm mt-1">Teaching: {activeExchange.teachSkill} • Learning: {activeExchange.learnSkill}</p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-bold font-serif italic">I Can Teach</h3>
          <div className="grid gap-3">
            {me.skillsOffered.map(skill => (
              <div key={skill} className="bg-card border border-border p-3 rounded-xl flex items-center justify-between shadow-sm">
                <span className="font-medium">{skill}</span>
                <Link href={`/quiz?skill=${encodeURIComponent(skill)}`}>
                  <Button variant="outline" size="sm" className="border-[#bd7880] text-[#bd7880] hover:bg-[#ffd9d9] hover:text-[#4d0011]">
                    Verify
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold font-serif italic">I Want to Learn</h3>
          <div className="flex flex-wrap gap-2">
            {me.skillsWanted.map(skill => (
              <Badge key={skill} className="bg-[#ffd9d9] text-[#4d0011] hover:bg-[#bd7880] hover:text-white px-3 py-1.5 text-sm">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold font-serif italic">Skill TBR</h3>
          <div className="flex flex-wrap gap-2">
            {me.skillTBR?.map(skill => (
              <Badge key={skill} variant="outline" className="px-3 py-1.5 text-sm border-dashed">
                {skill}
              </Badge>
            ))}
            {(!me.skillTBR || me.skillTBR.length === 0) && (
              <p className="text-sm text-muted-foreground">No skills to be read yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold font-serif italic">Monthly Goals</h3>
          <div className="space-y-3">
            {me.monthlyGoals?.map(goal => (
              <div key={goal.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span>{goal.title}</span>
                  <span className="text-muted-foreground">{goal.progress} / {goal.target}</span>
                </div>
                <Progress value={(goal.progress / goal.target) * 100} className="h-2" />
              </div>
            ))}
            {(!me.monthlyGoals || me.monthlyGoals.length === 0) && (
              <p className="text-sm text-muted-foreground">No monthly goals set.</p>
            )}
          </div>
        </div>

        {/* Skill DNA & Vouches CTAs */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/skill-dna">
            <div className="bg-[#4d0011] text-[#ffd9d9] rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                <Dna className="h-4 w-4" />
              </div>
              <p className="font-bold text-sm leading-none">Skill DNA</p>
              <p className="text-[10px] opacity-60 leading-snug">Your skill fingerprint</p>
            </div>
          </Link>
          <Link href="/vouches">
            <div className="bg-[#102b1f] text-white rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                <Shield className="h-4 w-4" />
              </div>
              <p className="font-bold text-sm leading-none">Reputation</p>
              <p className="text-[10px] opacity-60 leading-snug">Staked vouches</p>
            </div>
          </Link>
        </div>

        {/* Portfolio */}
        <PortfolioSection userSkills={[...(me.skillsOffered ?? []), ...(me.skillsWanted ?? [])]} />

        {/* Referral System */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold font-serif italic">Invite Friends</h3>
          <div className="bg-gradient-to-br from-[#4d0011]/8 to-[#ffd9d9]/30 border border-[#bd7880]/30 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#4d0011] rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="h-5 w-5 text-[#ffd9d9]" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#4d0011]">Refer & Earn</p>
                <p className="text-xs text-muted-foreground">You both get 15 credits when they join</p>
              </div>
            </div>

            {referral ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/60 border border-[#bd7880]/40 rounded-lg px-3 py-2 text-xs font-mono text-[#4d0011] truncate">
                    {referral.inviteLink}
                  </div>
                  <Button
                    size="sm"
                    onClick={copyLink}
                    className="bg-[#4d0011] hover:bg-[#4d0011]/90 text-white shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-1 text-xs">{copied ? "Copied!" : "Copy"}</span>
                  </Button>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 bg-white/50 rounded-xl p-3 text-center border border-white/60">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="h-4 w-4 text-[#4d0011]" />
                    </div>
                    <div className="text-xl font-black text-[#4d0011]">{referral.referralCount}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Referred</div>
                  </div>
                  <div className="flex-1 bg-white/50 rounded-xl p-3 text-center border border-white/60">
                    <div className="text-xl font-black text-[#4d0011]">{referral.creditsEarned}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Credits Earned</div>
                  </div>
                  <div className="flex-1 bg-white/50 rounded-xl p-3 text-center border border-white/60">
                    <div className="text-xl font-black text-[#4d0011]">{referral.rewardPerReferral}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Per Referral</div>
                  </div>
                </div>

                <div className="border-t border-[#bd7880]/20 pt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Have a friend's code? Redeem it:</p>
                  <div className="flex gap-2">
                    <Input
                      value={redeemCode}
                      onChange={e => setRedeemCode(e.target.value)}
                      placeholder="e.g. jamie-01"
                      className="text-sm h-9"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={redeemReferral}
                      disabled={redeemLoading || !redeemCode.trim()}
                      className="border-[#4d0011]/30 text-[#4d0011] shrink-0"
                    >
                      {redeemLoading ? "..." : "Redeem"}
                    </Button>
                  </div>
                  {redeemMsg && (
                    <p className={`text-xs font-medium ${redeemMsg.includes("earned") ? "text-green-600" : "text-destructive"}`}>
                      {redeemMsg}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground animate-pulse">Loading referral info...</div>
            )}
          </div>
        </div>

        {/* Skill Timeline — Feature #27 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-serif italic">Skill Journey</h3>
            <span className="text-xs text-muted-foreground">
              {exchanges?.filter(e => e.status === 'completed').length ?? 0} completed
            </span>
          </div>
          {(!exchanges || exchanges.filter(e => e.status === 'completed').length === 0) ? (
            <p className="text-sm text-muted-foreground italic">Your skill journey starts with the first exchange.</p>
          ) : (
            <div className="relative ml-4">
              {/* Vertical line */}
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#4d0011]/30 via-[#bd7880]/30 to-transparent" />
              <div className="space-y-4">
                {exchanges?.filter(e => e.status === 'completed').map((exchange, i) => (
                  <div key={exchange.id} className="relative flex gap-4 items-start">
                    {/* Node */}
                    <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                      i === 0 ? "bg-[#4d0011] border-[#4d0011]" : "bg-background border-[#bd7880]/50"
                    }`}>
                      {i === 0 ? (
                        <span className="text-white text-[8px]">★</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#bd7880]/50" />
                      )}
                    </div>
                    {/* Content */}
                    <div className={`flex-1 rounded-2xl p-3 border shadow-sm ${
                      i === 0 ? "bg-card border-[#4d0011]/20" : "bg-card/60 border-border"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={exchange.partnerAvatar} />
                          <AvatarFallback className="text-[9px]">{exchange.partnerName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold">{exchange.partnerName}</span>
                        {i === 0 && <span className="text-[10px] bg-[#4d0011]/10 text-[#4d0011] px-1.5 py-0.5 rounded-full font-semibold">Latest</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="flex items-center gap-1 bg-[#102b1f]/10 text-[#102b1f] px-2 py-0.5 rounded-full font-medium">
                          <ArrowRight className="h-3 w-3" />
                          Taught {exchange.teachSkill}
                        </span>
                        {exchange.learnSkill && (
                          <span className="flex items-center gap-1 bg-[#4d0011]/10 text-[#4d0011] px-2 py-0.5 rounded-full font-medium">
                            <ArrowLeft className="h-3 w-3" />
                            Learned {exchange.learnSkill}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
