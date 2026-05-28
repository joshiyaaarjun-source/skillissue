import { Router, type IRouter } from "express";
import { db, auctionsTable, auctionBidsTable, usersTable, creditTransactionsTable, ledgerTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();
const DEMO_USER_ID = 1;

async function seedAuctions() {
  const existing = await db.select().from(auctionsTable).limit(1);
  if (existing.length > 0) return;
  const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.insert(auctionsTable).values([
    { sellerId: 2, skillTag: "Python", title: "1-on-1 Python Deep Dive (60 min)", description: "From basics to async/await — your questions, my expertise.", reservePrice: 5, endsAt },
    { sellerId: 3, skillTag: "UI Design", title: "Portfolio Review + Redesign Session", description: "Live redesign of one screen from your portfolio with full commentary.", reservePrice: 8, endsAt: new Date(Date.now() + 18 * 60 * 60 * 1000) },
    { sellerId: 5, skillTag: "Figma", title: "Advanced Figma Components Workshop", description: "Variables, auto-layout, and component libraries from scratch.", reservePrice: 6, endsAt: new Date(Date.now() + 10 * 60 * 60 * 1000) },
  ]);
}
seedAuctions();

router.get("/auctions", async (req, res) => {
  const auctions = await db.select().from(auctionsTable).where(eq(auctionsTable.status, "active")).orderBy(desc(auctionsTable.endsAt));
  const users = await db.select().from(usersTable);
  const bids = await db.select().from(auctionBidsTable);

  const result = auctions.map(a => {
    const seller = users.find(u => u.id === a.sellerId);
    const topBidder = a.topBidderId ? users.find(u => u.id === a.topBidderId) : null;
    const myBid = bids.filter(b => b.auctionId === a.id && b.bidderId === DEMO_USER_ID).at(-1);
    const bidCount = bids.filter(b => b.auctionId === a.id).length;
    return { ...a, sellerName: seller?.name ?? "Unknown", sellerAvatar: seller?.avatar ?? "", topBidderName: topBidder?.name ?? null, myBid: myBid?.amount ?? null, bidCount };
  });

  res.json(result);
});

router.post("/auctions", async (req, res) => {
  const { skillTag, title, description, reservePrice } = req.body as { skillTag: string; title: string; description?: string; reservePrice?: number };
  const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [auction] = await db.insert(auctionsTable).values({
    sellerId: DEMO_USER_ID, skillTag, title,
    description: description ?? "",
    reservePrice: reservePrice ?? 5,
    endsAt,
  }).returning();
  return res.json(auction);
});

router.post("/auctions/:id/bid", async (req, res) => {
  const auctionId = parseInt(req.params.id);
  const { amount } = req.body as { amount: number };

  const [auction] = await db.select().from(auctionsTable).where(eq(auctionsTable.id, auctionId));
  if (!auction || auction.status !== "active") return res.status(404).json({ error: "Auction not found or closed" });
  if (auction.sellerId === DEMO_USER_ID) return res.status(400).json({ error: "Cannot bid on your own auction" });
  if (amount <= auction.currentBid) return res.status(400).json({ error: `Bid must exceed current bid of ${auction.currentBid}` });
  if (amount < auction.reservePrice) return res.status(400).json({ error: `Bid must meet reserve of ${auction.reservePrice}` });

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, DEMO_USER_ID));
  if (user.creditBalance < amount) return res.status(400).json({ error: "Insufficient credits" });

  await db.insert(auctionBidsTable).values({ auctionId, bidderId: DEMO_USER_ID, amount });
  await db.update(auctionsTable).set({ currentBid: amount, topBidderId: DEMO_USER_ID }).where(eq(auctionsTable.id, auctionId));

  return res.json({ success: true, newBid: amount });
});

export default router;
