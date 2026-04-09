import { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation, PanInfo } from "framer-motion";
import { X, Heart, Star, Sparkles } from "lucide-react";
import { useGetExploreUsers, getGetExploreUsersQueryKey, useRecordSwipe } from "@workspace/api-client-react";
import BottomNav from "@/components/BottomNav";
import SkillTag from "@/components/SkillTag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExploreUser } from "@workspace/api-client-react";
import confetti from "canvas-confetti";

export default function Explore() {
  const { data: users, isLoading } = useGetExploreUsers({ query: { queryKey: getGetExploreUsersQueryKey() } });
  const recordSwipe = useRecordSwipe();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatchOverlay, setShowMatchOverlay] = useState(false);
  const [matchedUser, setMatchedUser] = useState<ExploreUser | null>(null);
  
  const controls = useAnimation();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col pt-8 px-4 bg-background">
        <Skeleton className="h-[70vh] w-full rounded-3xl" />
        <BottomNav />
      </div>
    );
  }

  if (!users || currentIndex >= users.length) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 bg-background pb-24 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Sparkles className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">You're caught up!</h2>
        <p className="text-muted-foreground">Check back later for more people to swap skills with.</p>
        <BottomNav />
      </div>
    );
  }

  const currentUser = users[currentIndex];
  const nextUser = users[currentIndex + 1];

  const handleSwipe = async (direction: "left" | "right") => {
    // Animate card off screen
    await controls.start({
      x: direction === "right" ? 500 : -500,
      opacity: 0,
      rotate: direction === "right" ? 20 : -20,
      transition: { duration: 0.3 }
    });

    recordSwipe.mutate({
      data: { targetUserId: currentUser.id, direction }
    }, {
      onSuccess: (result) => {
        if (result.matched) {
          setMatchedUser(currentUser);
          setShowMatchOverlay(true);
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#4d0011', '#ffd9d9', '#bd7880']
          });
          setTimeout(() => {
            setShowMatchOverlay(false);
            setCurrentIndex(prev => prev + 1);
            controls.set({ x: 0, opacity: 1, rotate: 0 }); // reset for next card
          }, 2500);
        } else {
          setCurrentIndex(prev => prev + 1);
          controls.set({ x: 0, opacity: 1, rotate: 0 });
        }
      },
      onError: () => {
        // Optimistic UI update even on error to keep it feeling fast
        setCurrentIndex(prev => prev + 1);
        controls.set({ x: 0, opacity: 1, rotate: 0 });
      }
    });
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      handleSwipe("right");
    } else if (info.offset.x < -swipeThreshold) {
      handleSwipe("left");
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, opacity: 1 });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      <div className="flex-1 flex flex-col items-center justify-center p-4 pb-28 relative perspective-1000">
        
        {/* Next Card (peeking behind) */}
        {nextUser && (
          <div className="absolute w-[calc(100%-2rem)] h-[65vh] max-h-[600px] bg-card rounded-3xl shadow-sm border border-border scale-[0.95] -translate-y-4 z-0 flex flex-col overflow-hidden opacity-50 pointer-events-none">
             {/* Simplified preview */}
             <div className="h-1/2 bg-muted/30" />
          </div>
        )}

        {/* Current Card */}
        <motion.div
          key={currentUser.id}
          animate={controls}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.02, cursor: "grabbing" }}
          style={{ x: 0, rotate: 0 }}
          className="absolute w-[calc(100%-2rem)] h-[65vh] max-h-[600px] bg-card rounded-3xl shadow-xl border border-border z-10 flex flex-col overflow-hidden cursor-grab touch-none"
        >
          {/* Card Header Profile */}
          <div className="bg-gradient-to-b from-secondary/20 to-transparent p-6 flex flex-col items-center justify-center flex-shrink-0 relative">
            <div className="absolute top-4 right-4 bg-background/80 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />
              {currentUser.credibilityScore.toFixed(1)}
            </div>
            
            <Avatar className="h-28 w-28 border-4 border-background shadow-lg mb-4">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{currentUser.name}</h2>
            {currentUser.bio && (
              <p className="text-sm text-muted-foreground text-center mt-2 max-w-[80%] leading-snug">
                {currentUser.bio}
              </p>
            )}
          </div>

          {/* Card Content Skills */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Offers</h3>
              <div className="flex flex-wrap gap-2">
                {currentUser.skillsOffered.map(skill => (
                  <SkillTag 
                    key={skill} 
                    skill={skill} 
                    type="offered" 
                    isOverlapping={currentUser.overlappingSkills.includes(skill)} 
                  />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Wants</h3>
              <div className="flex flex-wrap gap-2">
                {currentUser.skillsWanted.map(skill => (
                  <SkillTag 
                    key={skill} 
                    skill={skill} 
                    type="wanted" 
                    isOverlapping={currentUser.overlappingSkills.includes(skill)} 
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="absolute bottom-28 w-full flex justify-center gap-6 z-20 px-8">
          <Button 
            size="icon" 
            variant="outline" 
            className="h-16 w-16 rounded-full border-2 border-muted-foreground text-muted-foreground hover:bg-red-50 hover:text-red-500 hover:border-red-500 shadow-lg transition-all active:scale-90 bg-background"
            onClick={() => handleSwipe("left")}
          >
            <X className="h-8 w-8" />
          </Button>
          
          <Button 
            size="icon" 
            className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_8px_30px_rgba(77,0,17,0.3)] transition-all active:scale-90"
            onClick={() => handleSwipe("right")}
          >
            <Heart className="h-8 w-8 fill-current" />
          </Button>
        </div>
      </div>

      <BottomNav />

      {/* Match Overlay */}
      <AnimatePresence>
        {showMatchOverlay && matchedUser && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.h1 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-5xl font-black text-[#ffd9d9] mb-4 italic font-serif"
            >
              It's a Match!
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-white font-medium mb-12"
            >
              ...but for skills.
            </motion.p>
            
            <motion.div 
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.6, type: "spring", bounce: 0.5 }}
              className="flex items-center justify-center gap-4 mb-12"
            >
               <Avatar className="h-24 w-24 border-4 border-[#ffd9d9] shadow-2xl">
                {/* using a placeholder for current user since we don't have it easily available here, or just show matched user big */}
                <AvatarImage src={matchedUser.avatar} />
                <AvatarFallback className="text-3xl bg-secondary text-white font-bold">{matchedUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-[#ffd9d9]/80"
            >
              You and {matchedUser.name} have overlapping skills.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
