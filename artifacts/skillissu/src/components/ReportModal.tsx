import { useState } from "react";
import { AlertTriangle, X, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const REASONS = [
  "Harassment or threatening behavior",
  "Inappropriate content",
  "Spam or fake profile",
  "No-show / ghosting after agreement",
  "Skill misrepresentation",
  "Other",
];

type Props = {
  open: boolean;
  onClose: () => void;
  reportedUserId: number;
  reportedUserName: string;
};

export default function ReportModal({ open, onClose, reportedUserId, reportedUserName }: Props) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/safety/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportedUserId, reason, details }),
      });
      const data = await r.json() as { message?: string; error?: string };
      if (r.ok) {
        setDone(true);
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background w-full max-w-md rounded-t-3xl p-6 pb-10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="font-bold text-base">Report {reportedUserName}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="h-7 w-7 text-green-600" />
            </div>
            <p className="font-bold text-sm">Report Submitted</p>
            <p className="text-xs text-muted-foreground">Our team will review it within 24 hours. Thank you for keeping Skillissu safe.</p>
            <Button variant="outline" className="mt-2" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reason</p>
              <div className="grid grid-cols-1 gap-2">
                {REASONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`text-left text-sm px-3 py-2.5 rounded-xl border transition-all ${
                      reason === r
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border text-foreground hover:border-primary/40"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional details (optional)</p>
              <Textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Describe what happened..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            {error && <p className="text-xs text-destructive font-medium">{error}</p>}

            <Button
              onClick={submit}
              disabled={!reason || submitting}
              className="w-full bg-[#4d0011] hover:bg-[#4d0011]/90 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
