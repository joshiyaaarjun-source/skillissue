import { useState } from "react";
import { motion } from "framer-motion";
import { Star, MessageCircle, Clock } from "lucide-react";
import { useGetMatches, getGetMatchesQueryKey } from "@workspace/api-client-react";
import BottomNav from "@/components/BottomNav";
import ExchangeModal from "@/components/ExchangeModal";
import SkillTag from "@/components/SkillTag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExploreUser } from "@workspace/api-client-react/src/generated/api.schemas";
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
  const { data: matches, isLoading } = useGetMatches({ query: { queryKey: getGetMatchesQueryKey() } });
  
  const [selectedPartner, setSelectedPartner] = useState<ExploreUser | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");

  const handleOpenModal = (partner: ExploreUser, matchId: string) => {
    setSelectedPartner(partner);
    setSelectedMatchId(matchId);
  };

  if (isLoading) {
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
            {matches.map((match) => (
              <motion.div 
                key={match.id} 
                variants={itemVariants}
                className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group"
                onClick={() => handleOpenModal(match.matchedUser, match.id)}
              >
                {/* Decorative accent */}
                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex gap-4 items-start">
                  <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                    <AvatarImage src={match.matchedUser.avatar} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-bold text-lg">
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
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 mb-3">
                      <Clock className="h-3 w-3" /> 
                      Matched {formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}
                    </div>

                    {match.overlappingSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {match.overlappingSkills.map(skill => (
                          <SkillTag key={skill} skill={skill} type="offered" isOverlapping={true} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
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
