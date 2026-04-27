import { useState, useEffect } from "react";
import { Plus, Trash2, ExternalLink, FolderOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

type PortfolioItem = {
  id: number;
  skill: string;
  title: string;
  description: string;
  url: string;
  mediaType: string;
};

const MEDIA_TYPES = [
  { value: "link", label: "🔗 Link" },
  { value: "github", label: "💻 GitHub" },
  { value: "video", label: "🎥 Video" },
  { value: "article", label: "📄 Article" },
  { value: "design", label: "🎨 Design" },
];

export default function PortfolioSection({ userSkills }: { userSkills: string[] }) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ skill: "", title: "", description: "", url: "", mediaType: "link" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portfolio")
      .then(r => r.json())
      .then((data: { items: PortfolioItem[] }) => {
        setItems(data.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const addItem = async () => {
    if (!form.skill || !form.title) { setError("Skill and title are required"); return; }
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json() as { item?: PortfolioItem; error?: string };
      if (r.ok && data.item) {
        setItems(prev => [...prev, data.item!]);
        setForm({ skill: "", title: "", description: "", url: "", mediaType: "link" });
        setShowAdd(false);
      } else {
        setError(data.error ?? "Failed to add item");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: number) => {
    await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold font-serif italic">Portfolio</h3>
        <Button
          size="sm"
          onClick={() => { setShowAdd(!showAdd); setError(null); }}
          variant="outline"
          className="border-[#4d0011]/30 text-[#4d0011] rounded-xl"
        >
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-1" />}
          {showAdd ? "Cancel" : "Add"}
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#ffd9d9]/20 border border-[#bd7880]/30 rounded-2xl p-4 space-y-3 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              {MEDIA_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setForm(f => ({ ...f, mediaType: t.value }))}
                  className={`text-xs py-1.5 px-2 rounded-lg border transition-all ${
                    form.mediaType === t.value ? "border-[#4d0011] bg-[#4d0011]/5 font-semibold text-[#4d0011]" : "border-border"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <select
              value={form.skill}
              onChange={e => setForm(f => ({ ...f, skill: e.target.value }))}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background"
            >
              <option value="">Select a skill...</option>
              {userSkills.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="Other">Other</option>
            </select>

            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Title (e.g. My React Dashboard Project)"
              className="text-sm"
            />
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description..."
              rows={2}
              className="text-sm resize-none"
            />
            <Input
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="URL (optional)"
              type="url"
              className="text-sm"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button
              onClick={addItem}
              disabled={saving}
              className="w-full bg-[#4d0011] hover:bg-[#4d0011]/90 text-white rounded-xl"
              size="sm"
            >
              {saving ? "Adding..." : "Add to Portfolio"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-sm text-muted-foreground animate-pulse">Loading portfolio...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-2xl space-y-2">
          <FolderOpen className="h-8 w-8 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">No portfolio items yet.</p>
          <p className="text-xs text-muted-foreground/60">Showcase your work by adding projects and links.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{item.skill}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {MEDIA_TYPES.find(t => t.value === item.mediaType)?.label ?? "🔗 Link"}
                    </span>
                  </div>
                  <p className="font-semibold text-sm leading-tight">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-[#4d0011] mt-1.5 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View project
                    </a>
                  )}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0 mt-0.5"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
