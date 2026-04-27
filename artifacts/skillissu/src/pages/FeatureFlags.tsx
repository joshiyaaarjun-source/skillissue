import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flag, ArrowLeft, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import BottomNav from "@/components/BottomNav";

type FeatureFlag = {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
};

export default function FeatureFlags() {
  const [, navigate] = useLocation();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/flags")
      .then(r => r.json())
      .then((data: { flags: FeatureFlag[] }) => {
        setFlags(data.flags ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggle = async (name: string, current: boolean) => {
    setSaving(name);
    setFlags(prev => prev.map(f => f.name === name ? { ...f, enabled: !current } : f));
    try {
      await fetch(`/api/flags/${name}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !current }),
      });
    } finally {
      setSaving(null);
    }
  };

  const updateRollout = async (name: string, rollout: number) => {
    setFlags(prev => prev.map(f => f.name === name ? { ...f, rolloutPercent: rollout } : f));
    await fetch(`/api/flags/${name}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rolloutPercent: rollout }),
    });
  };

  const enabledCount = flags.filter(f => f.enabled).length;

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <div className="bg-[#102b1f] text-white pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-white/60 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-60 mb-1">
              <Flag className="h-4 w-4" />
              <span>Admin</span>
            </div>
            <h1 className="text-3xl font-bold">Feature Flags</h1>
            <p className="text-xs opacity-60 mt-1">{enabledCount}/{flags.length} features active</p>
          </div>
          <button onClick={load} className="text-white/60 hover:text-white p-2">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : flags.map((flag, i) => (
          <motion.div
            key={flag.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-card border rounded-2xl p-4 transition-all ${
              flag.enabled ? "border-green-200/60 shadow-sm" : "border-border opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-foreground/70">
                    {flag.name}
                  </code>
                </div>
                <p className="text-sm font-medium leading-snug">{flag.description}</p>
                {flag.enabled && flag.rolloutPercent < 100 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Rollout</span>
                      <span>{flag.rolloutPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={flag.rolloutPercent}
                      onChange={e => updateRollout(flag.name, parseInt(e.target.value))}
                      className="w-full h-1.5 accent-[#102b1f]"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={() => toggle(flag.name, flag.enabled)}
                disabled={saving === flag.name}
                className={`relative w-12 h-6 rounded-full transition-all shrink-0 mt-0.5 ${
                  flag.enabled ? "bg-green-500" : "bg-muted"
                } ${saving === flag.name ? "opacity-50" : ""}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                  flag.enabled ? "left-7" : "left-1"
                }`} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
