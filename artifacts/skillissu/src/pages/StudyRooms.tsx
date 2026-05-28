import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Pin, Timer, Plus, X, Send, Circle } from "lucide-react";
import { useLocation } from "wouter";
import { useGetStudyRooms, getGetStudyRoomsQueryKey, useJoinStudyRoom, useLeaveStudyRoom, useGetStudyRoomPins, getGetStudyRoomPinsQueryKey, useAddStudyRoomPin } from "@workspace/api-client-react";
import type { StudyRoom } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";

function RoomDetail({ room, onClose }: { room: StudyRoom; onClose: () => void }) {
  const [pinText, setPinText] = useState("");
  const [sprintActive, setSprintActive] = useState(false);
  const [sprintSeconds, setSprintSeconds] = useState(0);
  const queryClient = useQueryClient();
  const joinRoom = useJoinStudyRoom();
  const leaveRoom = useLeaveStudyRoom();
  const addPin = useAddStudyRoomPin();
  const { data: pins, isLoading: pinsLoading } = useGetStudyRoomPins(String(room.id), { query: { queryKey: getGetStudyRoomPinsQueryKey(String(room.id)) } });

  const handleJoin = async () => {
    await joinRoom.mutateAsync({ id: String(room.id) });
    queryClient.invalidateQueries({ queryKey: getGetStudyRoomsQueryKey() });
  };

  const handleLeave = async () => {
    await leaveRoom.mutateAsync({ id: String(room.id) });
    queryClient.invalidateQueries({ queryKey: getGetStudyRoomsQueryKey() });
  };

  const handlePin = async () => {
    if (!pinText.trim()) return;
    await addPin.mutateAsync({ id: String(room.id), data: { content: pinText.trim() } });
    queryClient.invalidateQueries({ queryKey: getGetStudyRoomPinsQueryKey(String(room.id)) });
    setPinText("");
  };

  const startSprint = () => {
    setSprintActive(true);
    setSprintSeconds(room.sprintDuration * 60);
    const iv = setInterval(() => {
      setSprintSeconds(s => {
        if (s <= 1) { clearInterval(iv); setSprintActive(false); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const formatSprint = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="absolute inset-x-0 bottom-0 bg-background rounded-t-3xl h-[90dvh] flex flex-col"
      >
        <div className="bg-[#102b1f] text-white px-5 pt-5 pb-4 rounded-t-3xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1.5 flex-wrap">
              {room.tags.map(t => (
                <span key={t} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
            <button onClick={onClose} className="text-white/60"><X className="h-5 w-5" /></button>
          </div>
          <h2 className="text-xl font-bold">{room.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex -space-x-2">
              {room.presentMembers.slice(0, 4).map(m => (
                <Avatar key={m.id} className="h-7 w-7 border-2 border-[#102b1f]">
                  <AvatarImage src={m.avatar} />
                  <AvatarFallback className="text-[9px] bg-[#4d0011] text-white">{m.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-xs text-white/60">{room.presentCount} present · {room.memberCount} total</span>
            <div className="ml-auto">
              {room.isMember ? (
                <button onClick={handleLeave} className="text-xs text-white/60 border border-white/20 px-2.5 py-1 rounded-lg">Leave</button>
              ) : (
                <button onClick={handleJoin} className="text-xs font-bold bg-white text-[#102b1f] px-3 py-1 rounded-lg">Join</button>
              )}
            </div>
          </div>
        </div>

        {/* Sprint timer */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-[#bd7880]" />
            <span className="text-sm font-semibold">{room.sprintDuration}min sprint</span>
            {sprintActive && (
              <span className="text-lg font-black text-[#4d0011] tabular-nums">
                {formatSprint(sprintSeconds)}
              </span>
            )}
          </div>
          {!sprintActive ? (
            <button onClick={startSprint} className="text-xs font-bold bg-[#102b1f] text-white px-3 py-1.5 rounded-xl">
              Start Sprint
            </button>
          ) : (
            <button onClick={() => setSprintActive(false)} className="text-xs text-muted-foreground border border-border px-2.5 py-1.5 rounded-xl">
              Stop
            </button>
          )}
        </div>

        {/* Pinboard */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            <Pin className="h-3.5 w-3.5" />
            Shared Pinboard
          </div>
          {pinsLoading ? (
            [1, 2].map(i => <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />)
          ) : pins?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pins yet — add the first one!</p>
          ) : (
            pins?.map(pin => (
              <div key={pin.id} className="bg-[#ffd9d9]/20 border border-[#ffd9d9]/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={pin.authorAvatar} />
                    <AvatarFallback className="text-[8px]">{pin.authorName[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-muted-foreground font-medium">{pin.authorName}</span>
                </div>
                <p className="text-sm text-foreground">{pin.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Pin input */}
        <div className="p-4 border-t border-border flex gap-2">
          <input
            value={pinText}
            onChange={e => setPinText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handlePin()}
            placeholder="Add a pin to the board..."
            className="flex-1 bg-muted rounded-xl px-3 py-2.5 text-sm outline-none"
          />
          <button
            onClick={handlePin}
            disabled={!pinText.trim() || addPin.isPending}
            className="bg-[#102b1f] text-white rounded-xl px-3 disabled:opacity-40"
          >
            <Pin className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function StudyRooms() {
  const [, navigate] = useLocation();
  const { data: rooms, isLoading } = useGetStudyRooms({ query: { queryKey: getGetStudyRoomsQueryKey() } });
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null);

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <div className="bg-[#102b1f] text-white pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/explore")} className="flex items-center gap-1 text-white/60 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Study Rooms</h1>
            <p className="text-xs opacity-60">Group spaces · shared sprints · pinboards</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-28 bg-muted/50 rounded-2xl animate-pulse" />)
        ) : rooms?.map((room, idx) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            onClick={() => setSelectedRoom(room)}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm cursor-pointer hover:border-[#102b1f]/40 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-base">{room.name}</h3>
                <p className="text-xs text-muted-foreground">{room.topic}</p>
              </div>
              {room.isMember && (
                <span className="text-[10px] font-bold bg-[#102b1f]/10 text-[#102b1f] px-2 py-0.5 rounded-full">Member</span>
              )}
            </div>

            <div className="flex gap-1.5 flex-wrap mb-3">
              {room.tags.slice(0, 3).map(t => (
                <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{t}</span>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {room.presentMembers.slice(0, 3).map(m => (
                    <Avatar key={m.id} className="h-5 w-5 border-2 border-background">
                      <AvatarImage src={m.avatar} />
                      <AvatarFallback className="text-[7px] bg-[#bd7880] text-white">{m.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className={room.presentCount > 0 ? "text-green-500 font-medium" : ""}>{room.presentCount} online</span>
              </div>
              <span>·</span>
              <span>{room.memberCount}/{room.maxMembers} members</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><Timer className="h-3 w-3" />{room.sprintDuration}min</span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedRoom && <RoomDetail room={selectedRoom} onClose={() => setSelectedRoom(null)} />}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
