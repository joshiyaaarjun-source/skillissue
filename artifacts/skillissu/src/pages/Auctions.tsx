import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Gavel, Clock, Trophy, TrendingUp, Plus, X, ChevronUp } from "lucide-react";
import { useLocation } from "wouter";
import { useGetAuctions, getGetAuctionsQueryKey, usePlaceBid } from "@workspace/api-client-react";
import type { Auction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";

function Countdown({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endsAt]);

  const diff = new Date(endsAt).getTime() - Date.now();
  const urgent = diff < 3 * 60 * 60 * 1000;

  return (
    <span className={`text-xs font-mono font-bold tabular-nums ${urgent ? "text-red-400 animate-pulse" : "text-[#ffd9d9]"}`}>
      {timeLeft}
    </span>
  );
}

function BidModal({ auction, onClose }: { auction: Auction; onClose: () => void }) {
  const [amount, setAmount] = useState(Math.ceil((auction.currentBid || auction.reservePrice) + 1));
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const placeBid = usePlaceBid();

  const submit = async () => {
    setError("");
    if (amount <= auction.currentBid) { setError(`Must exceed current bid of ${auction.currentBid}C`); return; }
    if (amount < auction.reservePrice) { setError(`Must meet reserve of ${auction.reservePrice}C`); return; }
    try {
      await placeBid.mutateAsync({ id: String(auction.id), data: { amount } });
      queryClient.invalidateQueries({ queryKey: getGetAuctionsQueryKey() });
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Bid failed";
      setError(msg);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full bg-background rounded-t-3xl p-6 pb-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Place Your Bid</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-1 truncate">{auction.title}</p>
        <div className="flex gap-4 text-xs text-muted-foreground mb-5">
          <span>Current: <strong className="text-foreground">{auction.currentBid || "No bids"}C</strong></span>
          <span>Reserve: <strong className="text-foreground">{auction.reservePrice}C</strong></span>
        </div>

        <div className="flex gap-2 mb-3">
          {[1, 2, 5].map(inc => (
            <button key={inc} onClick={() => setAmount(a => a + inc)}
              className="flex-1 bg-muted rounded-xl py-2 text-sm font-semibold text-foreground">
              +{inc}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <input
            type="number"
            value={amount}
            min={auction.reservePrice}
            onChange={e => setAmount(parseInt(e.target.value) || 0)}
            className="w-full bg-muted rounded-2xl px-4 py-3 text-center text-2xl font-black text-foreground border-2 border-[#4d0011]/30 outline-none"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">C</span>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={placeBid.isPending}
          className="w-full bg-[#4d0011] text-white font-bold py-3.5 rounded-2xl text-base disabled:opacity-50"
        >
          {placeBid.isPending ? "Placing bid..." : `Bid ${amount}C`}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function Auctions() {
  const [, navigate] = useLocation();
  const { data: auctions, isLoading } = useGetAuctions({ query: { queryKey: getGetAuctionsQueryKey() } });
  const [biddingOn, setBiddingOn] = useState<Auction | null>(null);

  return (
    <div className="min-h-[100dvh] bg-background pb-24 overflow-x-hidden">
      <div className="bg-[#4d0011] text-[#ffd9d9] pt-12 pb-6 px-4 rounded-b-[2rem] shadow-md">
        <button onClick={() => navigate("/explore")} className="flex items-center gap-1 text-[#ffd9d9]/60 text-xs mb-3">
          <ArrowLeft className="h-4 w-4" />Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <Gavel className="h-5 w-5 text-[#ffd9d9]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Skill Auctions</h1>
            <p className="text-xs opacity-60">Bid credits to win exclusive 1-on-1 sessions</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {isLoading ? (
          [1, 2, 3].map(i => <div key={i} className="h-44 bg-muted/50 rounded-2xl animate-pulse" />)
        ) : auctions?.map((auction, idx) => (
          <motion.div
            key={auction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={auction.sellerAvatar} />
                <AvatarFallback className="bg-[#4d0011] text-[#ffd9d9] font-bold">{auction.sellerName[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-[#ffd9d9] text-[#4d0011] px-2 py-0.5 rounded-full">{auction.skillTag}</span>
                  {auction.myBid && <span className="text-[10px] bg-[#102b1f]/10 text-[#102b1f] px-1.5 py-0.5 rounded-full font-semibold">Your bid: {auction.myBid}C</span>}
                </div>
                <h3 className="font-bold text-sm mt-1 leading-tight">{auction.title}</h3>
                <p className="text-xs text-muted-foreground truncate">{auction.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-muted/50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current</p>
                <p className="text-lg font-black text-foreground">{auction.currentBid ? `${auction.currentBid}C` : "—"}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reserve</p>
                <p className="text-lg font-black text-foreground">{auction.reservePrice}C</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-2 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bids</p>
                <p className="text-lg font-black text-foreground">{auction.bidCount}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#bd7880]" />
                <Countdown endsAt={auction.endsAt} />
              </div>
              <button
                onClick={() => setBiddingOn(auction)}
                className="flex items-center gap-1.5 bg-[#4d0011] text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                Bid Now
              </button>
            </div>

            {auction.topBidderName && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Trophy className="h-3 w-3 text-yellow-500" />
                <span>Top bidder: <span className="font-semibold text-foreground">{auction.topBidderName}</span></span>
              </div>
            )}
          </motion.div>
        ))}

        {!isLoading && (!auctions || auctions.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <Gavel className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No active auctions right now</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {biddingOn && <BidModal auction={biddingOn} onClose={() => setBiddingOn(null)} />}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
