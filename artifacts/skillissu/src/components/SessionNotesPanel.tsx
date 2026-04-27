import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Pen, FileText, Trash2, Minus, Circle, Eraser, Loader2 } from "lucide-react";
import { useGetSessionNotes, useSaveSessionNotes, getGetSessionNotesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type Point = { x: number; y: number };
type Stroke = { color: string; width: number; points: Point[]; eraser?: boolean };

const COLORS = [
  { label: "Dark", value: "#1a0a0f" },
  { label: "Rose", value: "#bd7880" },
  { label: "Wine", value: "#4d0011" },
  { label: "Green", value: "#102b1f" },
  { label: "White", value: "#f5f0f1" },
  { label: "Amber", value: "#d97706" },
];

const WIDTHS = [2, 5, 12];

function WhiteboardCanvas({
  sessionId,
  strokes,
  onStrokesChange,
}: {
  sessionId: string;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[1].value);
  const [width, setWidth] = useState(WIDTHS[1]);
  const [eraser, setEraser] = useState(false);
  const currentStroke = useRef<Stroke | null>(null);

  const redraw = useCallback((allStrokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.eraser ? "#faf7f8" : stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, []);

  useEffect(() => { redraw(strokes); }, [strokes, redraw]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pos = getPos(e);
    currentStroke.current = { color, width, points: [pos], eraser };
    setDrawing(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !currentStroke.current) return;
    const pos = getPos(e);
    currentStroke.current.points.push(pos);
    redraw([...strokes, currentStroke.current]);
  };

  const onPointerUp = () => {
    if (!drawing || !currentStroke.current) return;
    const completed = currentStroke.current;
    currentStroke.current = null;
    setDrawing(false);
    onStrokesChange([...strokes, completed]);
  };

  const clear = () => onStrokesChange([]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        {/* Colors */}
        <div className="flex gap-1.5">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => { setColor(c.value); setEraser(false); }}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c.value && !eraser ? "border-white scale-125" : "border-white/20"}`}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <div className="w-px h-4 bg-white/20 mx-1" />

        {/* Brush sizes */}
        {WIDTHS.map(w => (
          <button
            key={w}
            onClick={() => { setWidth(w); setEraser(false); }}
            className={`flex items-center justify-center w-6 h-6 rounded-full ${width === w && !eraser ? "bg-white/20" : ""}`}
          >
            <div className="rounded-full bg-white" style={{ width: w, height: w }} />
          </button>
        ))}

        <div className="w-px h-4 bg-white/20 mx-1" />

        {/* Eraser */}
        <button
          onClick={() => setEraser(e => !e)}
          className={`w-6 h-6 flex items-center justify-center rounded ${eraser ? "bg-white/20" : ""}`}
        >
          <Eraser size={14} className="text-white" />
        </button>

        <div className="flex-1" />

        {/* Clear */}
        <button onClick={clear} className="flex items-center gap-1 text-white/40 hover:text-white/80 text-xs">
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-[#faf7f8] rounded-b-2xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full h-full touch-none cursor-crosshair"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        {strokes.length === 0 && !drawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground/30 text-sm italic">Draw anything here…</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SessionNotesPanel({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"notes" | "whiteboard">("notes");
  const [localText, setLocalText] = useState("");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [saving, setSaving] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveNotes = useSaveSessionNotes();

  const { data: notesData, isLoading } = useGetSessionNotes(sessionId, {
    query: { queryKey: getGetSessionNotesQueryKey(sessionId) },
  });

  useEffect(() => {
    if (notesData) {
      setLocalText(notesData.textNotes ?? "");
      setStrokes((notesData.strokes ?? []) as Stroke[]);
    }
  }, [notesData]);

  const scheduleSave = useCallback((text: string, strokesData: Stroke[]) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaving(true);
    saveTimeout.current = setTimeout(() => {
      saveNotes.mutate(
        { sessionId, data: { textNotes: text, strokes: strokesData as object[] } },
        {
          onSettled: () => {
            setSaving(false);
            queryClient.invalidateQueries({ queryKey: getGetSessionNotesQueryKey(sessionId) });
          },
        },
      );
    }, 800);
  }, [sessionId, saveNotes, queryClient]);

  const handleTextChange = (text: string) => {
    setLocalText(text);
    scheduleSave(text, strokes);
  };

  const handleStrokesChange = (newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
    scheduleSave(localText, newStrokes);
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28 }}
      className="absolute bottom-28 left-0 right-0 z-30 bg-[#1a0a0f] rounded-t-3xl overflow-hidden flex flex-col"
      style={{ maxHeight: "60vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10">
        <div className="flex gap-1 p-0.5 bg-white/10 rounded-xl">
          <button
            onClick={() => setTab("notes")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab === "notes" ? "bg-[#bd7880] text-white" : "text-white/50 hover:text-white/80"}`}
          >
            <FileText size={12} /> Notes
          </button>
          <button
            onClick={() => setTab("whiteboard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${tab === "whiteboard" ? "bg-[#bd7880] text-white" : "text-white/50 hover:text-white/80"}`}
          >
            <Pen size={12} /> Whiteboard
          </button>
        </div>

        <div className="flex items-center gap-2">
          {saving && <Loader2 size={12} className="text-white/40 animate-spin" />}
          {!saving && notesData && <span className="text-[10px] text-white/30">Saved</span>}
          <button onClick={onClose} className="text-white/40 hover:text-white/80 text-xs">✕</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={20} className="animate-spin text-[#bd7880]" />
          </div>
        ) : tab === "notes" ? (
          <textarea
            className="w-full h-full bg-transparent text-white/90 placeholder-white/20 text-sm p-4 resize-none focus:outline-none font-mono"
            placeholder="Type your session notes here…&#10;&#10;• Key takeaways&#10;• Action items&#10;• Questions to revisit"
            value={localText}
            onChange={e => handleTextChange(e.target.value)}
            style={{ minHeight: "180px" }}
          />
        ) : (
          <WhiteboardCanvas
            sessionId={sessionId}
            strokes={strokes}
            onStrokesChange={handleStrokesChange}
          />
        )}
      </div>
    </motion.div>
  );
}
