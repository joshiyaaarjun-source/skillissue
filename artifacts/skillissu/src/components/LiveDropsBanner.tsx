import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, X, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useGetLiveDrops, getGetLiveDropsQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function LiveDropsBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [, navigate] = useLocation();
  const { data: drops } = useGetLiveDrops({ query: { queryKey: getGetLiveDropsQueryKey() } });

  const activeDrop = drops?.[0];
  if (!activeDrop || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        className="mx-4 mb-3 bg-[#102b1f] text-white rounded-2xl p-3 shadow-lg border border-white/10 relative overflow-hidden cursor-pointer"
        onClick={() => navigate("/live-drops")}
      >
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-green-500/10" />
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-10 w-10 border-2 border-green-400/50">
              <AvatarImage src={activeDrop.hostAvatar} />
              <AvatarFallback className="text-xs bg-[#4d0011] text-white">{activeDrop.hostName[0]}</AvatarFallback>
            </Avatar>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#102b1f] animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Radio className="h-3 w-3 text-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Live Drop</span>
              <span className="text-[10px] bg-[#4d0011] px-1.5 py-0.5 rounded-full">{activeDrop.skillTag}</span>
            </div>
            <p className="text-sm font-bold leading-snug truncate">{activeDrop.title}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3 text-white/40" />
              <span className="text-[10px] text-white/50">{activeDrop.minutesLeft}min left · {activeDrop.hostName}</span>
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); setDismissed(true); }} className="text-white/30 p-1 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
