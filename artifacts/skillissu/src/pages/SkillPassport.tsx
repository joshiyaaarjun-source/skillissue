import { useRef } from "react";
import { motion } from "framer-motion";
import { Download, Shield, Flame, BookOpen, Star, Award, Dna } from "lucide-react";
import { useGetSkillPassport } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

export default function SkillPassport() {
  const [, navigate] = useLocation();
  const { data: passport, isLoading } = useGetSkillPassport();
  const passportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    const { default: html2canvas } = await import("html2canvas");
    const { default: jsPDF } = await import("jspdf");
    if (!passportRef.current) return;
    const canvas = await html2canvas(passportRef.current, { scale: 2, backgroundColor: "#fdf8f0" });
    const pdf = new jsPDF({ orientation: "portrait", format: "a4" });
    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`skillissue-passport-${passport?.user.name?.replace(/\s+/g, "-").toLowerCase() ?? "user"}.pdf`);
  };

  if (isLoading) return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="space-y-3 w-full max-w-sm p-4">
        {[1,2,3,4].map(i => <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  if (!passport) return null;

  const stats = [
    { icon: BookOpen, label: "Total Exchanges", value: passport.totalExchanges, color: "text-[#4d0011] bg-[#ffd9d9]/50" },
    { icon: Star, label: "Credits Earned", value: `${passport.creditsEarnedLifetime}C`, color: "text-amber-700 bg-amber-100" },
    { icon: Flame, label: "Longest Streak", value: `${passport.longestStreak}d`, color: "text-orange-700 bg-orange-100" },
    { icon: Award, label: "Badges Earned", value: passport.badgeCount, color: "text-[#102b1f] bg-[#102b1f]/10" },
    { icon: Dna, label: "Capsules Created", value: passport.capsulesCreated, color: "text-purple-700 bg-purple-100" },
    { icon: Shield, label: "Partner Streaks", value: passport.partnerStreakCount, color: "text-[#bd7880] bg-[#ffd9d9]/40" },
  ];

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-1 text-[#ffd9d9]/60 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-lg">🛂</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Skill Passport</h1>
              <p className="text-xs opacity-60">Your verifiable skill journey — export as PDF</p>
            </div>
          </div>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 bg-white/10 text-[#ffd9d9] text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20">
            <Download className="h-3.5 w-3.5" />Export PDF
          </button>
        </div>
      </div>

      <div className="p-4">
        <div ref={passportRef} className="bg-[#fdf8f0] rounded-3xl overflow-hidden border-2 border-[#4d0011]/20">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#4d0011] to-[#bd7880] p-6 text-white">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/30">
                <AvatarImage src={passport.user.avatar} />
                <AvatarFallback className="text-xl bg-white/20 text-white">{passport.user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-white/60 font-bold">skillissue Passport</p>
                <h2 className="text-xl font-black">{passport.user.name}</h2>
                <p className="text-sm text-white/70">Level {passport.user.level} · {passport.user.xp} XP</p>
              </div>
            </div>
            {passport.user.bio && <p className="text-xs text-white/70 mt-3 italic">"{passport.user.bio}"</p>}
          </div>

          {/* Verified Skills */}
          {passport.verifiedSkills.length > 0 && (
            <div className="p-5 border-b border-[#4d0011]/10">
              <h3 className="text-xs font-black text-[#4d0011] uppercase tracking-widest mb-3">✓ Verified Skills</h3>
              <div className="flex flex-wrap gap-2">
                {passport.verifiedSkills.map(skill => (
                  <span key={skill} className="flex items-center gap-1 bg-[#4d0011] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <Shield className="h-2.5 w-2.5" />{skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="p-5 border-b border-[#4d0011]/10">
            <h3 className="text-xs font-black text-[#4d0011] uppercase tracking-widest mb-3">Journey Stats</h3>
            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ icon: Icon, label, value, color }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                  <Icon className="h-4 w-4 mx-auto mb-1" />
                  <p className="text-lg font-black">{value}</p>
                  <p className="text-[9px] font-bold opacity-70 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 text-center">
            <p className="text-[10px] text-[#4d0011]/50 font-bold tracking-widest uppercase">Issued by skillissue · we swiped right...on skills</p>
            <p className="text-[10px] text-[#4d0011]/40 mt-1">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
