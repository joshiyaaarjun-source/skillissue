import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Dna, Share2, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useGetSkillDna, getGetSkillDnaQueryKey } from "@workspace/api-client-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import BottomNav from "@/components/BottomNav";

const DNA_DIMS = [
  { key: "depth", label: "Depth", desc: "How deeply you master skills", color: "#4d0011" },
  { key: "breadth", label: "Breadth", desc: "Range of your skill portfolio", color: "#bd7880" },
  { key: "teaching", label: "Teaching", desc: "Your credibility as a teacher", color: "#102b1f" },
  { key: "speed", label: "Speed", desc: "How quickly you skill up", color: "#4d0011" },
  { key: "curiosity", label: "Curiosity", desc: "Appetite for new knowledge", color: "#bd7880" },
];

export default function SkillDna() {
  const [, navigate] = useLocation();
  const { data: dna, isLoading, refetch, isRefetching } = useGetSkillDna({ query: { queryKey: getGetSkillDnaQueryKey() } });
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const radarData = dna?.available ? DNA_DIMS.map(d => ({
    subject: d.label,
    value: (dna as unknown as Record<string, number>)[d.key] ?? 0,
    fullMark: 100,
  })) : [];

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-1 text-[#ffd9d9]/60 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Dna className="h-5 w-5 text-[#ffd9d9]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Skill DNA</h1>
              <p className="text-xs opacity-60">Your unique skill fingerprint</p>
            </div>
          </div>
          <button onClick={() => refetch()} className="text-[#ffd9d9]/60 p-2">
            <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-4">
          <div className="h-64 bg-muted/50 rounded-3xl animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)}
          </div>
        </div>
      ) : !dna?.available ? (
        <div className="flex flex-col items-center justify-center p-8 text-center mt-12">
          <Dna className="h-16 w-16 text-[#bd7880]/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">DNA Locked</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
            {(dna as { message?: string } | undefined)?.message ?? "Complete at least 3 exchanges to unlock your Skill DNA profile."}
          </p>
          <button onClick={() => navigate("/explore")} className="mt-6 bg-[#4d0011] text-white font-bold py-3 px-8 rounded-2xl">
            Start Exchanging
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-5">
          {/* Radar card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-3xl p-5 shadow-sm"
          >
            <h2 className="text-center font-bold text-sm text-muted-foreground uppercase tracking-widest mb-1">Your Skill Profile</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#4d0011" strokeOpacity={0.15} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#4d0011", fontSize: 11, fontWeight: 700 }}
                  />
                  <Radar
                    name="DNA"
                    dataKey="value"
                    stroke="#4d0011"
                    fill="#4d0011"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Dimension bars */}
          <div className="space-y-3">
            {DNA_DIMS.map((dim, i) => {
              const val = (dna as unknown as Record<string, number>)[dim.key] ?? 0;
              return (
                <motion.div
                  key={dim.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card border border-border rounded-2xl p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="font-bold text-sm">{dim.label}</span>
                      <p className="text-xs text-muted-foreground">{dim.desc}</p>
                    </div>
                    <span className="text-2xl font-black tabular-nums" style={{ color: dim.color }}>
                      {Math.round(val)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ delay: i * 0.08 + 0.3, duration: 0.8, ease: "easeOut" }}
                      className="h-2 rounded-full"
                      style={{ backgroundColor: dim.color }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 bg-[#4d0011] text-white font-bold py-4 rounded-2xl"
          >
            <Share2 className="h-4 w-4" />
            {shared ? "Copied to clipboard!" : "Share Skill DNA"}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
