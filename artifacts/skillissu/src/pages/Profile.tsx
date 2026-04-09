import { useGetMe, getGetMeQueryKey, useGetExchanges, getGetExchangesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Star, CheckCircle, Upload } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CreditCounter from "@/components/CreditCounter";

export default function Profile() {
  const { data: me, isLoading: meLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: exchanges, isLoading: exchangesLoading } = useGetExchanges({ query: { queryKey: getGetExchangesQueryKey() } });

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
          <h1 className="text-3xl font-bold mb-2">{me.name}</h1>
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

        <div className="space-y-4">
          <h3 className="text-xl font-bold font-serif italic">Recent Exchanges</h3>
          <div className="space-y-3">
            {exchanges?.filter(e => e.status === 'completed').slice(0, 3).map(exchange => (
              <div key={exchange.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={exchange.partnerAvatar} />
                  <AvatarFallback>{exchange.partnerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-bold">{exchange.partnerName}</p>
                  <p className="text-xs text-muted-foreground">Taught {exchange.teachSkill}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            ))}
            {(!exchanges || exchanges.filter(e => e.status === 'completed').length === 0) && (
              <p className="text-sm text-muted-foreground">No completed exchanges yet.</p>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
