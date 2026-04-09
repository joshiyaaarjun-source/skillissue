import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageCircle, Clock, Video, Activity } from "lucide-react";
import { useGetMatches, getGetMatchesQueryKey, useGetExchanges, getGetExchangesQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import BottomNav from "@/components/BottomNav";
import ExchangeModal from "@/components/ExchangeModal";
import SkillTag from "@/components/SkillTag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExploreUser } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Matches() {
  const { data: matches, isLoading: matchesLoading } = useGetMatches({ query: { queryKey: getGetMatchesQueryKey() } });
  const { data: exchanges, isLoading: exchangesLoading } = useGetExchanges({ query: { queryKey: getGetExchangesQueryKey() } });
  
  const [selectedPartner, setSelectedPartner] = useState<ExploreUser | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");

  const handleOpenModal = (partner: ExploreUser, matchId: string) => {
    setSelectedPartner(partner);
    setSelectedMatchId(matchId);
  };

  if (matchesLoading || exchangesLoading) {
    return (
      <div className="min-h-[100dvh] bg-background p-4 pt-12 space-y-4 pb-24">
        <h1 className="text-3xl font-bold px-2 mb-6">Your Connections</h1>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
        <BottomNav />
      </div>
    );
  }

  const getActiveExchangeForMatch = (matchId: string) => {
    return exchanges?.find(e => e.matchId === matchId && e.status === 'active');
  };

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="p-4 pt-12">
        <h1 className="text-3xl font-bold px-2 mb-2">Your Connections</h1>
        <p className="text-muted-foreground px-2 mb-6">People ready to trade skills with you.</p>

        {(!matches || matches.length === 0) ? (
          <div className="text-center py-20 px-4">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No connections yet</h3>
            <p className="text-muted-foreground">Keep swiping to find people to exchange skills with.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4"
          >
            {matches.map((match) => {
              const activeExchange = getActiveExchangeForMatch(match.id);
              
              return (
                <motion.div 
                  key={match.id} 
                  variants={itemVariants}
                  className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                >
                  <div className="flex gap-4 items-start mb-4">
                    <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                      <AvatarImage src={match.matchedUser.avatar} />
                      <AvatarFallback className="bg-[#bd7880] text-white font-bold text-lg">
                        {match.matchedUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg truncate pr-2">{match.matchedUser.name}</h3>
                        <div className="flex items-center gap-1 text-xs font-medium bg-muted px-2 py-0.5 rounded-full shrink-0">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          {match.matchedUser.credibilityScore.toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 mb-2">
                        <Clock className="h-3 w-3" /> 
                        Matched {formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}
                      </div>

                      {activeExchange && (
                        <Badge variant="outline" className="mb-2 bg-green-50 text-green-700 border-green-200 gap-1 pl-1 pr-2">
                          <Activity className="h-3 w-3" /> Active Exchange
                        </Badge>
                      )}

                      {match.overlappingSkills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {match.overlappingSkills.map(skill => (
                            <SkillTag key={skill} skill={skill} type="offered" isOverlapping={true} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link href={`/chat/${match.id}`} className="block">
                      <Button variant="outline" className="w-full border-[#bd7880] text-[#4d0011] hover:bg-[#ffd9d9] font-bold">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </Link>
                    <Button 
                      className="w-full bg-[#4d0011] text-white hover:bg-[#4d0011]/90 font-bold"
                      onClick={() => handleOpenModal(match.matchedUser, match.id)}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Start Session
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      <ExchangeModal 
        isOpen={!!selectedPartner} 
        onClose={() => setSelectedPartner(null)} 
        partner={selectedPartner}
        matchId={selectedMatchId}
      />

      <BottomNav />
    </div>
  );
}
