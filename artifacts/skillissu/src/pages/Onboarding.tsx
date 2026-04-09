import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const AVAILABLE_SKILLS = [
  "React", "TypeScript", "Python", "UI Design", "Figma", 
  "Data Analysis", "Machine Learning", "Illustration", 
  "Animation", "Public Speaking", "Writing", "Copywriting", 
  "Marketing", "Node.js", "GraphQL", "DevOps", "Mobile Dev"
];

const AVAILABILITY_OPTIONS = [
  "Weekday Mornings", "Weekday Evenings", "Weekends", "Flexible"
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const completeOnboarding = useCompleteOnboarding();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    skillsOffered: [] as string[],
    skillsWanted: [] as string[],
    availability: ""
  });

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      completeOnboarding.mutate({ data: formData }, {
        onSuccess: () => setLocation("/dashboard")
      });
    }
  };

  const toggleSkill = (skill: string, type: "offered" | "wanted") => {
    const key = type === "offered" ? "skillsOffered" : "skillsWanted";
    setFormData(prev => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(skill) ? list.filter(s => s !== skill) : [...list, skill]
      };
    });
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.name.trim().length > 0;
      case 2: return formData.skillsOffered.length > 0;
      case 3: return formData.skillsWanted.length > 0;
      case 4: return !!formData.availability;
      default: return false;
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#4d0011] text-[#ffd9d9] p-6 flex flex-col relative overflow-hidden">
      {/* Abstract background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#bd7880] rounded-full blur-[120px] opacity-20 pointer-events-none" />
      
      <div className="w-full max-w-md mx-auto mt-8 flex flex-col flex-1 z-10">
        <div className="mb-8">
          <div className="flex justify-between text-sm font-bold mb-2 text-[#ffd9d9]/70">
            <span>Step {step} of 4</span>
          </div>
          <Progress value={(step / 4) * 100} className="h-2 bg-[#bd7880]/30 [&>div]:bg-[#bd7880]" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {step === 1 && (
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-4xl font-extrabold mb-8 font-serif italic text-white">What's your name?</h2>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  className="bg-transparent border-0 border-b-2 border-[#bd7880] rounded-none text-2xl px-0 py-4 h-auto focus-visible:ring-0 focus-visible:border-white placeholder:text-[#ffd9d9]/30 text-white"
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div className="flex-1">
                <h2 className="text-3xl font-extrabold mb-4 font-serif italic text-white">What can you teach?</h2>
                <p className="text-[#ffd9d9]/80 mb-8">Select skills you're confident sharing with others.</p>
                <div className="flex flex-wrap gap-3">
                  {AVAILABLE_SKILLS.map(skill => {
                    const isSelected = formData.skillsOffered.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill, "offered")}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                          isSelected 
                            ? "bg-[#bd7880] text-white shadow-md scale-105" 
                            : "bg-white/10 text-[#ffd9d9] hover:bg-white/20 border border-white/20"
                        }`}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex-1">
                <h2 className="text-3xl font-extrabold mb-4 font-serif italic text-white">What do you want to learn?</h2>
                <p className="text-[#ffd9d9]/80 mb-8">Select skills you want to trade for.</p>
                <div className="flex flex-wrap gap-3">
                  {AVAILABLE_SKILLS.map(skill => {
                    const isSelected = formData.skillsWanted.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill, "wanted")}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                          isSelected 
                            ? "bg-[#bd7880] text-white shadow-md scale-105" 
                            : "bg-white/10 text-[#ffd9d9] hover:bg-white/20 border border-white/20"
                        }`}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex-1 flex flex-col justify-center">
                <h2 className="text-3xl font-extrabold mb-8 font-serif italic text-white">When are you available?</h2>
                <div className="grid gap-4">
                  {AVAILABILITY_OPTIONS.map(option => {
                    const isSelected = formData.availability === option;
                    return (
                      <button
                        key={option}
                        onClick={() => setFormData(prev => ({ ...prev, availability: option }))}
                        className={`p-5 rounded-2xl font-bold text-lg text-left transition-all ${
                          isSelected 
                            ? "bg-[#bd7880] text-white shadow-lg border-2 border-transparent scale-[1.02]" 
                            : "bg-white/5 text-[#ffd9d9] border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 pt-4 border-t border-white/10">
          <Button 
            onClick={handleNext}
            disabled={!isStepValid() || completeOnboarding.isPending}
            className="w-full h-14 bg-white text-[#4d0011] hover:bg-[#ffd9d9] text-lg font-bold rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] disabled:opacity-50 disabled:bg-white/50"
          >
            {completeOnboarding.isPending ? "Saving..." : step === 4 ? "Complete Profile" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
