import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCompleteOnboarding } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, Plus, X } from "lucide-react";

const TOTAL_STEPS = 6;

const TEACH_SKILLS = [
  "React", "TypeScript", "Python", "UI Design", "Figma",
  "Data Analysis", "Machine Learning", "Illustration",
  "Animation", "Public Speaking", "Writing", "Copywriting",
  "Marketing", "Node.js", "GraphQL", "DevOps", "Mobile Dev",
  "Photography", "Video Editing", "3D Modeling",
];

const LEARN_SKILLS = [
  "React", "TypeScript", "Python", "UI Design", "Figma",
  "Data Analysis", "Machine Learning", "Illustration",
  "Animation", "Public Speaking", "Writing", "Copywriting",
  "Marketing", "Node.js", "GraphQL", "DevOps", "Mobile Dev",
  "Photography", "Video Editing", "3D Modeling",
];

const AVAILABILITY_OPTIONS = [
  { label: "Weekend mornings", sub: "Sat & Sun, 8am–12pm" },
  { label: "Weekday mornings", sub: "Mon–Fri, 8am–12pm" },
  { label: "Weekday evenings", sub: "Mon–Fri, 5pm–9pm" },
  { label: "Flexible", sub: "Any time works for me" },
];

const DOMAINS = [
  "Technology", "Design", "Business", "Marketing",
  "Education", "Arts & Creativity", "Science", "Fitness & Wellness",
  "Finance", "Language & Communication", "Engineering", "Legal",
];

interface FormData {
  name: string;
  bio: string;
  skillsOffered: string[];
  noneOffered: boolean;
  skillsWanted: string[];
  noneWanted: boolean;
  availability: string;
  domains: string[];
  linkedIn: string;
  customSkillsOffered: string[];
  customSkillsWanted: string[];
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between text-xs font-semibold mb-2 text-[#ffd9d9]/60">
        <span>Step {step} of {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#bd7880] rounded-full"
          initial={{ width: `${((step - 1) / total) * 100}%` }}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function SkillChip({
  skill,
  selected,
  onClick,
}: {
  skill: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
        selected
          ? "bg-[#bd7880] border-[#bd7880] text-white shadow-md"
          : "bg-white/5 border-white/15 text-[#ffd9d9]/80 hover:bg-white/10 hover:border-white/30"
      }`}
    >
      {skill}
    </motion.button>
  );
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const completeOnboarding = useCompleteOnboarding();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [showOtherTeach, setShowOtherTeach] = useState(false);
  const [showOtherLearn, setShowOtherLearn] = useState(false);
  const [customTeachInput, setCustomTeachInput] = useState("");
  const [customLearnInput, setCustomLearnInput] = useState("");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    bio: "",
    skillsOffered: [],
    noneOffered: false,
    skillsWanted: [],
    noneWanted: false,
    availability: "",
    domains: [],
    linkedIn: "",
    customSkillsOffered: [],
    customSkillsWanted: [],
  });

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep(s => s + 1);
    } else {
      const allOffered = formData.noneOffered
        ? []
        : [...formData.skillsOffered, ...formData.customSkillsOffered];
      const allWanted = formData.noneWanted
        ? []
        : [...formData.skillsWanted, ...formData.customSkillsWanted];

      completeOnboarding.mutate(
        {
          data: {
            name: formData.name,
            bio: formData.bio,
            skillsOffered: allOffered,
            skillsWanted: allWanted,
            availability: formData.availability || "Flexible",
            domains: formData.domains,
            linkedIn: formData.linkedIn || undefined,
          },
        },
        {
          onSuccess: () => setLocation("/dashboard"),
        }
      );
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const toggleTeachSkill = (skill: string) => {
    if (formData.noneOffered) return;
    setFormData(prev => ({
      ...prev,
      skillsOffered: prev.skillsOffered.includes(skill)
        ? prev.skillsOffered.filter(s => s !== skill)
        : [...prev.skillsOffered, skill],
    }));
  };

  const toggleLearnSkill = (skill: string) => {
    if (formData.noneWanted) return;
    setFormData(prev => ({
      ...prev,
      skillsWanted: prev.skillsWanted.includes(skill)
        ? prev.skillsWanted.filter(s => s !== skill)
        : [...prev.skillsWanted, skill],
    }));
  };

  const toggleDomain = (domain: string) => {
    setFormData(prev => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter(d => d !== domain)
        : [...prev.domains, domain],
    }));
  };

  const addCustomTeachSkill = () => {
    const val = customTeachInput.trim();
    if (val && !formData.customSkillsOffered.includes(val)) {
      setFormData(prev => ({
        ...prev,
        customSkillsOffered: [...prev.customSkillsOffered, val],
        noneOffered: false,
      }));
    }
    setCustomTeachInput("");
  };

  const addCustomLearnSkill = () => {
    const val = customLearnInput.trim();
    if (val && !formData.customSkillsWanted.includes(val)) {
      setFormData(prev => ({
        ...prev,
        customSkillsWanted: [...prev.customSkillsWanted, val],
        noneWanted: false,
      }));
    }
    setCustomLearnInput("");
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.name.trim().length > 0;
      case 2: return formData.bio.trim().length > 0;
      case 3:
        return formData.noneOffered ||
          formData.skillsOffered.length > 0 ||
          formData.customSkillsOffered.length > 0;
      case 4:
        return formData.noneWanted ||
          formData.skillsWanted.length > 0 ||
          formData.customSkillsWanted.length > 0;
      case 5: return !!formData.availability;
      case 6: return formData.domains.length > 0;
      default: return false;
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="min-h-[100dvh] bg-[#4d0011] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-15%] left-[-15%] w-[55%] h-[55%] bg-[#bd7880] rounded-full blur-[140px] opacity-15 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ffd9d9] rounded-full blur-[160px] opacity-8 pointer-events-none" />

      {/* Player card container */}
      <div className="w-full max-w-sm z-10">

        {/* Logo mark */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-[#ffd9d9] rounded-xl flex items-center justify-center shadow-lg rotate-2">
            <span className="text-[#4d0011] text-sm font-bold font-serif italic">S</span>
          </div>
          <span className="text-[#ffd9d9]/70 text-sm font-semibold tracking-wide">Skillissu</span>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 shadow-2xl min-h-[520px] flex flex-col">
          <ProgressBar step={step} total={TOTAL_STEPS} />

          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="h-full flex flex-col"
              >
                {/* STEP 1: Name */}
                {step === 1 && (
                  <div className="flex flex-col flex-1 justify-center gap-6">
                    <div>
                      <p className="text-[#bd7880] text-xs font-bold uppercase tracking-widest mb-1">Let's start</p>
                      <h2 className="text-3xl font-extrabold text-white leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        What's your name?
                      </h2>
                    </div>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && isStepValid() && goNext()}
                      placeholder="Your full name"
                      autoFocus
                      className="bg-transparent border-0 border-b-2 border-[#bd7880]/50 rounded-none text-2xl text-white placeholder:text-white/25 focus:border-[#bd7880] focus-visible:ring-0 px-0 pb-2 h-auto transition-colors"
                    />
                  </div>
                )}

                {/* STEP 2: Bio */}
                {step === 2 && (
                  <div className="flex flex-col flex-1 justify-center gap-6">
                    <div>
                      <p className="text-[#bd7880] text-xs font-bold uppercase tracking-widest mb-1">About you</p>
                      <h2 className="text-3xl font-extrabold text-white leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        Tell us a little about yourself
                      </h2>
                      <p className="text-[#ffd9d9]/55 text-sm mt-2">1–2 sentences. What do you do? What drives you?</p>
                    </div>
                    <Textarea
                      value={formData.bio}
                      onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                      placeholder="e.g. Full-stack dev by day, aspiring illustrator by night..."
                      rows={3}
                      autoFocus
                      className="bg-white/5 border border-white/15 rounded-2xl text-white text-base placeholder:text-white/25 focus-visible:ring-1 focus-visible:ring-[#bd7880] focus-visible:border-[#bd7880] resize-none p-4 transition-colors"
                    />
                  </div>
                )}

                {/* STEP 3: Skills to teach */}
                {step === 3 && (
                  <div className="flex flex-col gap-4 flex-1">
                    <div>
                      <p className="text-[#bd7880] text-xs font-bold uppercase tracking-widest mb-1">Your offerings</p>
                      <h2 className="text-2xl font-extrabold text-white leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        What can you teach?
                      </h2>
                      <p className="text-[#ffd9d9]/55 text-xs mt-1">Skills you're confident sharing with others.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto -mr-2 pr-2">
                      <div className="flex flex-wrap gap-2">
                        {TEACH_SKILLS.map(skill => (
                          <SkillChip
                            key={skill}
                            skill={skill}
                            selected={!formData.noneOffered && formData.skillsOffered.includes(skill)}
                            onClick={() => toggleTeachSkill(skill)}
                          />
                        ))}

                        {/* Custom added chips */}
                        {formData.customSkillsOffered.map(skill => (
                          <div key={skill} className="flex items-center gap-1 px-3 py-2 rounded-full bg-[#bd7880] text-white text-sm font-semibold">
                            <span>{skill}</span>
                            <button
                              onClick={() => setFormData(p => ({ ...p, customSkillsOffered: p.customSkillsOffered.filter(s => s !== skill) }))}
                              className="ml-1 opacity-70 hover:opacity-100"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}

                        {/* + Other chip */}
                        {!showOtherTeach ? (
                          <button
                            onClick={() => { setShowOtherTeach(true); setFormData(p => ({ ...p, noneOffered: false })); }}
                            className="px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-dashed border-white/25 text-[#ffd9d9]/60 hover:bg-white/10 flex items-center gap-1"
                          >
                            <Plus size={13} /> Other
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 w-full mt-1">
                            <Input
                              value={customTeachInput}
                              onChange={e => setCustomTeachInput(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") { addCustomTeachSkill(); setShowOtherTeach(false); } if (e.key === "Escape") setShowOtherTeach(false); }}
                              placeholder="Enter skill name..."
                              autoFocus
                              className="flex-1 bg-white/5 border border-[#bd7880]/50 rounded-full text-sm text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#bd7880] px-4 py-1.5 h-auto"
                            />
                            <button
                              onClick={() => { addCustomTeachSkill(); setShowOtherTeach(false); }}
                              className="px-3 py-1.5 rounded-full bg-[#bd7880] text-white text-sm font-semibold"
                            >Add</button>
                          </div>
                        )}
                      </div>

                      {/* None chip — mutually exclusive */}
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setFormData(p => ({
                            ...p,
                            noneOffered: !p.noneOffered,
                            skillsOffered: !p.noneOffered ? [] : p.skillsOffered,
                            customSkillsOffered: !p.noneOffered ? [] : p.customSkillsOffered,
                          }))}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                            formData.noneOffered
                              ? "bg-[#bd7880] border-[#bd7880] text-white"
                              : "bg-white/5 border-white/15 text-[#ffd9d9]/50 hover:bg-white/10"
                          }`}
                        >
                          None — I'd rather learn
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Skills to learn */}
                {step === 4 && (
                  <div className="flex flex-col gap-4 flex-1">
                    <div>
                      <p className="text-[#bd7880] text-xs font-bold uppercase tracking-widest mb-1">Your wishlist</p>
                      <h2 className="text-2xl font-extrabold text-white leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        What do you want to learn?
                      </h2>
                      <p className="text-[#ffd9d9]/55 text-xs mt-1">Skills you want to trade for.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto -mr-2 pr-2">
                      <div className="flex flex-wrap gap-2">
                        {LEARN_SKILLS.map(skill => (
                          <SkillChip
                            key={skill}
                            skill={skill}
                            selected={!formData.noneWanted && formData.skillsWanted.includes(skill)}
                            onClick={() => toggleLearnSkill(skill)}
                          />
                        ))}

                        {formData.customSkillsWanted.map(skill => (
                          <div key={skill} className="flex items-center gap-1 px-3 py-2 rounded-full bg-[#bd7880] text-white text-sm font-semibold">
                            <span>{skill}</span>
                            <button
                              onClick={() => setFormData(p => ({ ...p, customSkillsWanted: p.customSkillsWanted.filter(s => s !== skill) }))}
                              className="ml-1 opacity-70 hover:opacity-100"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}

                        {!showOtherLearn ? (
                          <button
                            onClick={() => { setShowOtherLearn(true); setFormData(p => ({ ...p, noneWanted: false })); }}
                            className="px-4 py-2 rounded-full text-sm font-semibold bg-white/5 border border-dashed border-white/25 text-[#ffd9d9]/60 hover:bg-white/10 flex items-center gap-1"
                          >
                            <Plus size={13} /> Other
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 w-full mt-1">
                            <Input
                              value={customLearnInput}
                              onChange={e => setCustomLearnInput(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") { addCustomLearnSkill(); setShowOtherLearn(false); } if (e.key === "Escape") setShowOtherLearn(false); }}
                              placeholder="Enter skill name..."
                              autoFocus
                              className="flex-1 bg-white/5 border border-[#bd7880]/50 rounded-full text-sm text-white placeholder:text-white/30 focus-visible:ring-1 focus-visible:ring-[#bd7880] px-4 py-1.5 h-auto"
                            />
                            <button
                              onClick={() => { addCustomLearnSkill(); setShowOtherLearn(false); }}
                              className="px-3 py-1.5 rounded-full bg-[#bd7880] text-white text-sm font-semibold"
                            >Add</button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setFormData(p => ({
                            ...p,
                            noneWanted: !p.noneWanted,
                            skillsWanted: !p.noneWanted ? [] : p.skillsWanted,
                            customSkillsWanted: !p.noneWanted ? [] : p.customSkillsWanted,
                          }))}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                            formData.noneWanted
                              ? "bg-[#bd7880] border-[#bd7880] text-white"
                              : "bg-white/5 border-white/15 text-[#ffd9d9]/50 hover:bg-white/10"
                          }`}
                        >
                          None — I'll decide later
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Availability */}
                {step === 5 && (
                  <div className="flex flex-col gap-5 flex-1">
                    <div>
                      <p className="text-[#bd7880] text-xs font-bold uppercase tracking-widest mb-1">Your schedule</p>
                      <h2 className="text-2xl font-extrabold text-white leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        When are you available?
                      </h2>
                      <p className="text-[#ffd9d9]/55 text-xs mt-1">Choose one that fits your rhythm.</p>
                    </div>
                    <div className="flex flex-col gap-3 flex-1 justify-center">
                      {AVAILABILITY_OPTIONS.map(opt => {
                        const sel = formData.availability === opt.label;
                        return (
                          <motion.button
                            key={opt.label}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setFormData(p => ({ ...p, availability: opt.label }))}
                            className={`w-full p-4 rounded-2xl text-left transition-all border ${
                              sel
                                ? "bg-[#bd7880]/20 border-[#bd7880] shadow-md"
                                : "bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`font-bold text-sm ${sel ? "text-[#bd7880]" : "text-[#ffd9d9]"}`}>{opt.label}</p>
                                <p className="text-[#ffd9d9]/45 text-xs mt-0.5">{opt.sub}</p>
                              </div>
                              {sel && (
                                <div className="w-5 h-5 rounded-full bg-[#bd7880] flex items-center justify-center flex-shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 6: Domain / Expertise */}
                {step === 6 && (
                  <div className="flex flex-col gap-4 flex-1">
                    <div>
                      <p className="text-[#bd7880] text-xs font-bold uppercase tracking-widest mb-1">Your domain</p>
                      <h2 className="text-2xl font-extrabold text-white leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        Area of expertise
                      </h2>
                      <p className="text-[#ffd9d9]/55 text-xs mt-1">Select one or more that describe your world.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto -mr-2 pr-2">
                      <div className="flex flex-wrap gap-2">
                        {DOMAINS.map(domain => (
                          <SkillChip
                            key={domain}
                            skill={domain}
                            selected={formData.domains.includes(domain)}
                            onClick={() => toggleDomain(domain)}
                          />
                        ))}
                      </div>

                      {/* Optional LinkedIn */}
                      <div className="mt-6 pt-4 border-t border-white/10">
                        <p className="text-[#ffd9d9]/40 text-xs font-semibold mb-2 uppercase tracking-wide">Optional — add later</p>
                        <Input
                          value={formData.linkedIn}
                          onChange={e => setFormData(p => ({ ...p, linkedIn: e.target.value }))}
                          placeholder="LinkedIn profile URL"
                          className="bg-white/5 border border-white/15 rounded-2xl text-white text-sm placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-[#bd7880]/50 focus-visible:border-[#bd7880]/50 px-4 py-3 h-auto"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={goBack}
                className="flex-shrink-0 px-4 py-3 rounded-2xl border border-white/15 text-[#ffd9d9]/60 text-sm font-semibold hover:border-white/30 hover:text-[#ffd9d9]/80 transition-all"
              >
                Back
              </button>
            )}
            <Button
              onClick={goNext}
              disabled={!isStepValid() || completeOnboarding.isPending}
              className="flex-1 h-12 bg-white text-[#4d0011] hover:bg-[#ffd9d9] font-bold rounded-2xl text-sm shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {completeOnboarding.isPending ? (
                "Saving..."
              ) : step === TOTAL_STEPS ? (
                "Complete Profile"
              ) : (
                <>Continue <ChevronRight size={16} /></>
              )}
            </Button>
          </div>
        </div>

        {/* Skip hint */}
        {step < TOTAL_STEPS && (
          <p className="text-center mt-4 text-[#ffd9d9]/30 text-xs">
            You can update these anytime from your profile.
          </p>
        )}
      </div>
    </div>
  );
}
