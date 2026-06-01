import { motion } from "framer-motion";
import { Dna, MessageCircle } from "lucide-react";
import { useGetSkillTwin } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";

export default function SkillTwinCard() {
  const { data: result, isLoading } = useGetSkillTwin();
  const [, navigate] = useLocation();

  if (isLoading) return <div className="h-28 bg-muted/50 rounded-2xl animate-pulse" />;
  if (!result?.hasTwin || !result.twin) return null;

  const { twin } = result;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-900 to-[#4d0011] rounded-2xl p-4 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Dna className="h-4 w-4 text-purple-300" />
        <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">Skill Twin Found</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-purple-400">
            <AvatarImage src={twin.avatar} />
            <AvatarFallback className="bg-purple-800 text-white text-sm">{twin.name[0]}</AvatarFallback>
          </Avatar>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-400 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-black text-white">{twin.similarity}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">You and {twin.name} are <span className="text-purple-300">{twin.similarity}% skill twins</span> 🧬</p>
          <p className="text-[11px] text-white/60 mt-0.5">
            Shared: {twin.sharedSkills.slice(0, 3).join(", ")}
          </p>
        </div>
      </div>
      <button onClick={() => navigate("/chat")}
        className="mt-3 w-full flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold py-2 rounded-xl">
        <MessageCircle className="h-3.5 w-3.5" />Start Swap · "{twin.chatStarter.slice(0, 40)}..."
      </button>
    </motion.div>
  );
}
