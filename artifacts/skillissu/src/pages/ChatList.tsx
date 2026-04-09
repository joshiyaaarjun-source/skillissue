import { useGetChatList, getGetChatListQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import BottomNav from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";

export default function ChatList() {
  const { data: chats, isLoading } = useGetChatList({ query: { queryKey: getGetChatListQueryKey() } });

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background p-4 pt-12 space-y-4 pb-24">
        <h1 className="text-3xl font-bold font-serif italic mb-6">Messages</h1>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-24">
      <div className="p-4 pt-12">
        <h1 className="text-3xl font-bold font-serif italic mb-6">Messages</h1>

        {(!chats || chats.length === 0) ? (
          <div className="text-center py-20 px-4">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No messages yet</h3>
            <p className="text-muted-foreground">Match with someone to start chatting!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <Link key={chat.matchId} href={`/chat/${chat.matchId}`}>
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4 group">
                  <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                    <AvatarImage src={chat.partner.avatar} />
                    <AvatarFallback className="bg-[#bd7880] text-white font-bold">
                      {chat.partner.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-base truncate pr-2 group-hover:text-[#4d0011] transition-colors">{chat.partner.name}</h3>
                      {chat.lastMessageAt && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-sm truncate ${chat.unreadCount > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {chat.lastMessage || "Start the conversation..."}
                    </p>
                  </div>

                  {chat.unreadCount > 0 && (
                    <div className="bg-[#4d0011] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
