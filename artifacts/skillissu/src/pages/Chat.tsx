import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useGetChatMessages, getGetChatMessagesQueryKey, useSendChatMessage } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Mic } from "lucide-react";
import VoiceNotes from "@/components/VoiceNotes";
import { useQueryClient } from "@tanstack/react-query";

export default function Chat() {
  const { matchId } = useParams();
  const queryClient = useQueryClient();
  const [showVoiceNotes, setShowVoiceNotes] = useState(false);
  
  const { data: messages, isLoading } = useGetChatMessages(matchId || "", { 
    query: { queryKey: getGetChatMessagesQueryKey(matchId || ""), enabled: !!matchId } 
  });
  
  const sendMessage = useSendChatMessage();
  
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !matchId) return;

    sendMessage.mutate(
      { matchId, data: { text } },
      {
        onSuccess: () => {
          setText("");
          queryClient.invalidateQueries({ queryKey: getGetChatMessagesQueryKey(matchId) });
        }
      }
    );
  };

  if (!matchId) return null;

  const partnerName = messages && messages.length > 0 ? messages.find(m => !m.isMine)?.senderName || "Partner" : "Chat";

  return (
    <div className="flex flex-col h-[100dvh] bg-white">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link href="/chat">
          <Button variant="ghost" size="icon" className="shrink-0 -ml-2">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </Link>
        <Avatar className="h-10 w-10 border border-border">
          <AvatarFallback className="bg-[#bd7880] text-white">{partnerName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base truncate leading-tight">{partnerName}</h2>
          <p className="text-xs text-muted-foreground truncate font-serif italic">we swiped right...on skills</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <span className="text-muted-foreground text-sm">Loading messages...</span>
          </div>
        ) : messages?.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground text-sm">No messages yet. Send a message to start!</p>
          </div>
        ) : (
          messages?.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.isMine 
                    ? "bg-[#FFD9D9] text-[#4D0011] rounded-tr-sm" 
                    : "bg-[#BD7880] text-white rounded-tl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <span className={`text-[10px] block mt-1 ${msg.isMine ? "text-[#4D0011]/60 text-right" : "text-white/70"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Voice Notes panel */}
      {showVoiceNotes && (
        <div className="border-t border-border bg-white px-3 pt-2 pb-1">
          <VoiceNotes />
        </div>
      )}

      {/* Input */}
      <div className="p-3 bg-white border-t border-border pb-safe">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={`h-12 w-12 rounded-full shrink-0 ${showVoiceNotes ? "bg-[#ffd9d9] text-[#4d0011]" : "text-muted-foreground"}`}
            onClick={() => setShowVoiceNotes(v => !v)}
          >
            <Mic className="h-5 w-5" />
          </Button>
          <Input 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-muted border-none h-12 px-4 focus-visible:ring-1 focus-visible:ring-[#4d0011]"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-12 w-12 rounded-full bg-[#4D0011] hover:bg-[#4D0011]/90 shrink-0"
            disabled={!text.trim() || sendMessage.isPending}
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </form>
      </div>
    </div>
  );
}
