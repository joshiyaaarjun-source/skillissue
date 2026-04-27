import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Trophy, Zap, Heart, Coins, TrendingUp, AlertCircle, Info, ArrowLeft } from "lucide-react";
import { useGetNotifications, getGetNotificationsQueryKey } from "@workspace/api-client-react";
import type { Notification } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import BottomNav from "@/components/BottomNav";
import { useLocation } from "wouter";

function getNotifIcon(type: string) {
  switch (type) {
    case "match": return { Icon: Heart, bg: "bg-pink-100", color: "text-pink-500" };
    case "credit_earned": return { Icon: Coins, bg: "bg-yellow-100", color: "text-yellow-600" };
    case "credit_spent": return { Icon: Coins, bg: "bg-orange-100", color: "text-orange-500" };
    case "goal_progress": return { Icon: TrendingUp, bg: "bg-green-100", color: "text-green-600" };
    case "inactivity": return { Icon: AlertCircle, bg: "bg-red-100", color: "text-red-500" };
    case "streak": return { Icon: Zap, bg: "bg-purple-100", color: "text-purple-500" };
    case "achievement": return { Icon: Trophy, bg: "bg-amber-100", color: "text-amber-500" };
    default: return { Icon: Info, bg: "bg-blue-100", color: "text-blue-500" };
  }
}

function getToneStyle(tone: string) {
  if (tone === "roast") return "italic text-foreground/80";
  if (tone === "hype") return "font-semibold text-foreground";
  return "text-foreground/90";
}

export default function Notifications() {
  const [, navigate] = useLocation();
  const { data: notifications, isLoading } = useGetNotifications({ query: { queryKey: getGetNotificationsQueryKey() } });
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [allRead, setAllRead] = useState(false);

  const markRead = async (id: string) => {
    setReadIds(prev => new Set([...prev, id]));
    await fetch(`/api/notifications/${id}/read`, { method: "POST" }).catch(() => {});
  };

  const markAllRead = async () => {
    setAllRead(true);
    const ids = notifications?.map(n => n.id) ?? [];
    setReadIds(new Set(ids));
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  };

  const unreadCount = notifications?.filter(n => !n.read && !readIds.has(n.id)).length ?? 0;

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-[#ffd9d9]/70 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-70 mb-1">
              <Bell className="h-4 w-4" />
              <span>Activity</span>
            </div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-xs opacity-70 mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && !allRead && (
            <Button
              size="sm"
              variant="ghost"
              onClick={markAllRead}
              className="text-[#ffd9d9]/70 hover:text-[#ffd9d9] text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Bell className="h-12 w-12 text-muted-foreground/20 mx-auto" />
            <p className="text-sm text-muted-foreground">All caught up! No notifications yet.</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notif: Notification) => {
              const isRead = notif.read || readIds.has(notif.id) || allRead;
              const { Icon, bg, color } = getNotifIcon(notif.type);
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => !isRead && markRead(notif.id)}
                  className={`flex gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                    isRead
                      ? "bg-card border-border opacity-60"
                      : "bg-white border-[#bd7880]/20 shadow-sm"
                  }`}
                >
                  <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${getToneStyle(notif.tone)}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </span>
                      {!isRead && (
                        <span className="w-2 h-2 bg-[#4d0011] rounded-full" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
