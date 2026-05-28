import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Play, Pause, Trash2, Send, Square } from "lucide-react";

type Note = {
  id: string;
  blob: Blob;
  url: string;
  duration: number;
  timestamp: Date;
};

function WaveformBar({ active }: { active: boolean }) {
  return (
    <motion.div
      animate={{ height: active ? [4, 16, 6, 20, 8, 14, 4] : 4 }}
      transition={{ duration: 0.6, repeat: active ? Infinity : 0, ease: "easeInOut" }}
      className="w-0.5 bg-current rounded-full"
    />
  );
}

export default function VoiceNotes({ onSend }: { onSend?: (blob: Blob, duration: number) => void }) {
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    notes.forEach(n => URL.revokeObjectURL(n.url));
  }, []);

  const startRecording = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const id = crypto.randomUUID();
        setNotes(prev => [...prev, { id, blob, url, duration: recordSeconds, timestamp: new Date() }]);
        setRecordSeconds(0);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      timerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch (e) {
      setError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !recording) return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const playNote = (note: Note) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingId === note.id) {
      setPlayingId(null);
      return;
    }
    const audio = new Audio(note.url);
    audioRef.current = audio;
    setPlayingId(note.id);
    audio.onended = () => setPlayingId(null);
    audio.play();
  };

  const deleteNote = (id: string) => {
    if (playingId === id && audioRef.current) {
      audioRef.current.pause();
      setPlayingId(null);
    }
    setNotes(prev => {
      const n = prev.find(n => n.id === id);
      if (n) URL.revokeObjectURL(n.url);
      return prev.filter(n => n.id !== id);
    });
  };

  const sendNote = (note: Note) => {
    onSend?.(note.blob, note.duration);
    deleteNote(note.id);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      {error && <p className="text-red-500 text-xs px-1">{error}</p>}

      {/* Recording button */}
      <div className="flex items-center gap-3">
        {!recording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 bg-[#4d0011] text-white text-sm font-bold px-4 py-2.5 rounded-xl"
          >
            <Mic className="h-4 w-4" />
            Record Voice Note
          </button>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-1 text-[#4d0011] h-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <WaveformBar key={i} active={recording} />
              ))}
            </div>
            <span className="text-sm font-mono font-bold text-[#4d0011] tabular-nums">{fmt(recordSeconds)}</span>
            <button
              onClick={stopRecording}
              className="ml-auto flex items-center gap-1.5 bg-red-500 text-white text-sm font-bold px-3 py-2 rounded-xl"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop
            </button>
          </div>
        )}
      </div>

      {/* Recorded notes */}
      <AnimatePresence>
        {notes.map(note => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className="flex items-center gap-2 bg-[#ffd9d9]/20 border border-[#ffd9d9]/40 rounded-2xl p-3"
          >
            <button
              onClick={() => playNote(note)}
              className="w-9 h-9 rounded-full bg-[#4d0011] text-white flex items-center justify-center shrink-0"
            >
              {playingId === note.id ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1 h-4">
                {Array.from({ length: 16 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-[#4d0011]/30 rounded-full"
                    style={{ height: `${Math.random() * 12 + 4}px` }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-mono">{fmt(note.duration)}</span>
            </div>

            <div className="flex gap-1 shrink-0">
              {onSend && (
                <button onClick={() => sendNote(note)}
                  className="w-8 h-8 rounded-xl bg-[#102b1f] text-white flex items-center justify-center">
                  <Send className="h-3.5 w-3.5" />
                </button>
              )}
              <button onClick={() => deleteNote(note.id)}
                className="w-8 h-8 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
