import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare,
  Clock, Star, ChevronRight, Loader2, CheckCircle2, PenLine, EyeOff
} from "lucide-react";
import SessionNotesPanel from "@/components/SessionNotesPanel";
import { useStartSession, useEndSession, useSubmitSessionFeedback } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { Session } from "@workspace/api-client-react";

function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return { seconds, formatted: fmt(seconds) };
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2 justify-center">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} onClick={() => onChange(i)}>
          <Star
            size={32}
            className={`transition-colors ${i <= value ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

function FeedbackModal({
  session,
  onSubmit,
  onSkip,
}: {
  session: Session;
  onSubmit: (rating: number, review: string) => void;
  onSkip: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const submitFeedback = useSubmitSessionFeedback();

  const handleSubmit = () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    submitFeedback.mutate({ sessionId: session.id, data: { rating, review } }, {
      onSuccess: () => { setSubmitted(true); setTimeout(() => onSubmit(rating, review), 1200); },
      onError: () => onSubmit(rating, review),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[500] bg-black/80 flex items-end justify-center"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 28 }}
        className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10"
      >
        {submitted ? (
          <div className="text-center py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-xl font-bold text-[#4d0011]">Feedback submitted!</h3>
            <p className="text-muted-foreground text-sm mt-1">Thank you for helping build the community.</p>
          </div>
        ) : (
          <>
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-5" />
            <div className="text-center mb-6">
              <Avatar className="h-16 w-16 border-2 border-[#ffd9d9] mx-auto mb-3">
                <AvatarImage src={session.partnerAvatar} />
                <AvatarFallback className="bg-[#bd7880] text-white font-bold text-xl">{session.partnerName[0]}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold text-[#4d0011]" style={{ fontFamily: "Georgia, serif" }}>
                How was your session?
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Rate your session with <span className="font-semibold">{session.partnerName}</span>
              </p>
            </div>

            <div className="space-y-5">
              <StarRating value={rating} onChange={setRating} />

              <textarea
                className="w-full border border-border rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#bd7880]/40 bg-[#faf7f8] h-24"
                placeholder="Share what made this session great (optional)…"
                value={review}
                onChange={e => setReview(e.target.value)}
              />

              <button onClick={() => setIsAnonymous(v => !v)}
                className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${isAnonymous ? "bg-[#4d0011]/10 border-[#4d0011]/30 text-[#4d0011]" : "bg-muted border-border text-muted-foreground"}`}>
                <EyeOff className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{isAnonymous ? "Posting anonymously — your name won't show" : "Post feedback anonymously"}</span>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${isAnonymous ? "bg-[#4d0011]" : "bg-muted-foreground/30"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${isAnonymous ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </button>

              {/* Session summary */}
              <div className="flex items-center justify-around py-3 bg-[#faf7f8] rounded-2xl">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#4d0011]">{Math.floor(session.durationSeconds / 60)}m</p>
                  <p className="text-[10px] text-muted-foreground">Duration</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">+{session.creditsEarned}C</p>
                  <p className="text-[10px] text-muted-foreground">Earned</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-lg font-bold text-[#4d0011]">{rating > 0 ? `${rating}/5` : "–"}</p>
                  <p className="text-[10px] text-muted-foreground">Your rating</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={onSkip} className="flex-1 text-muted-foreground">
                  Skip
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitFeedback.isPending || rating === 0}
                  className="flex-1 bg-[#4d0011] hover:bg-[#4d0011]/85 text-white font-bold rounded-2xl"
                >
                  {submitFeedback.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                  Submit
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

export default function VideoSession() {
  const { matchId } = useParams<{ matchId: string }>();
  const [, navigate] = useLocation();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<"connecting" | "live" | "ending" | "feedback" | "done">("connecting");
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatLog, setChatLog] = useState<{ me: boolean; text: string }[]>([]);

  const startSession = useStartSession();
  const endSession = useEndSession();
  const { seconds, formatted: timerText } = useTimer(phase === "live");

  // Request camera + mic, then start session record
  useEffect(() => {
    let mediaStream: MediaStream | null = null;

    const init = async () => {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch {
        // Camera denied — continue without stream
      }

      startSession.mutate({ data: { matchId: matchId! } }, {
        onSuccess: (s) => { setSession(s); setPhase("live"); },
        onError: () => { toast.error("Failed to start session"); navigate("/matches"); },
      });
    };

    init();

    return () => {
      mediaStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Sync camera off state to video track
  useEffect(() => {
    stream?.getVideoTracks().forEach(t => { t.enabled = !cameraOff; });
  }, [cameraOff, stream]);

  // Sync mute state to audio track
  useEffect(() => {
    stream?.getAudioTracks().forEach(t => { t.enabled = !muted; });
  }, [muted, stream]);

  const handleEndSession = async () => {
    if (!session) return;
    setPhase("ending");
    stream?.getTracks().forEach(t => t.stop());
    endSession.mutate({ sessionId: session.id }, {
      onSuccess: (ended) => { setSession(ended); setPhase("feedback"); },
      onError: () => { toast.error("Failed to end session cleanly"); setPhase("feedback"); },
    });
  };

  const handleFeedbackDone = () => {
    setPhase("done");
    setTimeout(() => navigate("/matches"), 1200);
  };

  if (phase === "connecting") {
    return (
      <div className="min-h-[100dvh] bg-[#0e0a0c] flex flex-col items-center justify-center text-white p-6">
        <Loader2 className="h-10 w-10 animate-spin text-[#bd7880] mb-4" />
        <p className="text-lg font-semibold">Connecting…</p>
        <p className="text-[#ffd9d9]/50 text-sm mt-1">Setting up your session</p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-[100dvh] bg-[#0e0a0c] flex flex-col items-center justify-center text-white p-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
          <CheckCircle2 className="h-16 w-16 text-green-400 mb-4 mx-auto" />
        </motion.div>
        <p className="text-xl font-bold">Session complete!</p>
        <p className="text-[#ffd9d9]/60 text-sm mt-1">Returning to Matches…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0e0a0c] flex flex-col relative overflow-hidden">
      {/* Partner view (simulated — full background) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a0f] to-[#0e0a0c]">
        {session && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 opacity-30">
              <Avatar className="h-40 w-40">
                <AvatarImage src={session.partnerAvatar} className="object-cover" />
                <AvatarFallback className="text-6xl font-bold bg-[#4d0011] text-[#ffd9d9]">
                  {session.partnerName[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-2xl font-bold">{session.partnerName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-2">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur rounded-full px-3 py-1.5">
          <div className={`w-2 h-2 rounded-full ${phase === "live" ? "bg-green-400 animate-pulse" : "bg-amber-400"}`} />
          <Clock size={12} className="text-white/60" />
          <span className="text-white text-sm font-mono font-bold">{timerText}</span>
        </div>

        {session && (
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur rounded-full px-3 py-1.5">
            <Avatar className="h-6 w-6">
              <AvatarImage src={session.partnerAvatar} />
              <AvatarFallback className="text-xs bg-[#bd7880] text-white">{session.partnerName[0]}</AvatarFallback>
            </Avatar>
            <span className="text-white text-xs font-medium">{session.partnerName}</span>
          </div>
        )}
      </div>

      {/* Self-view (bottom-right PiP) */}
      <div className="absolute bottom-36 right-4 z-20 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#1a0a0f]">
        {!cameraOff && stream ? (
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoOff size={20} className="text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 to-transparent" />
        <p className="absolute bottom-1.5 left-0 right-0 text-center text-[9px] text-white/70 font-medium">You</p>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28 }}
            className="absolute bottom-28 left-0 right-0 z-30 bg-black/80 backdrop-blur rounded-t-3xl p-4 max-h-[50vh] flex flex-col"
          >
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-[80px]">
              {chatLog.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-4 italic">Session chat will appear here.</p>
              ) : (
                chatLog.map((m, i) => (
                  <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                    <span className={`text-xs px-3 py-1.5 rounded-2xl max-w-[80%] ${m.me ? "bg-[#bd7880] text-white" : "bg-white/10 text-white"}`}>
                      {m.text}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 bg-white/10 text-white rounded-full px-4 py-2 text-sm placeholder-white/30 focus:outline-none"
                placeholder="Type a message…"
                value={chatMsg}
                onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && chatMsg.trim()) {
                    setChatLog(l => [...l, { me: true, text: chatMsg.trim() }]);
                    setChatMsg("");
                  }
                }}
              />
              <button
                onClick={() => { if (chatMsg.trim()) { setChatLog(l => [...l, { me: true, text: chatMsg.trim() }]); setChatMsg(""); } }}
                className="w-9 h-9 bg-[#bd7880] rounded-full flex items-center justify-center"
              >
                <ChevronRight size={16} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-4 px-6">
        <button
          onClick={() => setMuted(m => !m)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${muted ? "bg-red-500/80" : "bg-white/10 backdrop-blur"}`}
        >
          {muted ? <MicOff size={22} className="text-white" /> : <Mic size={22} className="text-white" />}
        </button>

        <button
          onClick={handleEndSession}
          disabled={phase === "ending"}
          className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-2xl transition-colors disabled:opacity-60"
        >
          {phase === "ending" ? (
            <Loader2 size={28} className="text-white animate-spin" />
          ) : (
            <PhoneOff size={28} className="text-white" />
          )}
        </button>

        <button
          onClick={() => setCameraOff(c => !c)}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${cameraOff ? "bg-red-500/80" : "bg-white/10 backdrop-blur"}`}
        >
          {cameraOff ? <VideoOff size={22} className="text-white" /> : <Video size={22} className="text-white" />}
        </button>
      </div>

      {/* Chat + Notes toggles */}
      <div className="absolute bottom-28 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => { setShowChat(s => !s); setShowNotes(false); }}
          className={`w-10 h-10 backdrop-blur rounded-full flex items-center justify-center ${showChat ? "bg-[#bd7880]" : "bg-white/10"}`}
        >
          <MessageSquare size={18} className="text-white" />
        </button>
        <button
          onClick={() => { setShowNotes(s => !s); setShowChat(false); }}
          className={`w-10 h-10 backdrop-blur rounded-full flex items-center justify-center ${showNotes ? "bg-[#bd7880]" : "bg-white/10"}`}
        >
          <PenLine size={18} className="text-white" />
        </button>
      </div>

      {/* Notes & Whiteboard panel */}
      <AnimatePresence>
        {showNotes && session && (
          <SessionNotesPanel
            sessionId={session.id}
            onClose={() => setShowNotes(false)}
          />
        )}
      </AnimatePresence>

      {/* Feedback modal */}
      <AnimatePresence>
        {phase === "feedback" && session && (
          <FeedbackModal
            session={session}
            onSubmit={handleFeedbackDone}
            onSkip={handleFeedbackDone}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
