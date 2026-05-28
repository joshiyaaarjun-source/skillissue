import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";

export const auctionsTable = pgTable("auctions", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  skillTag: text("skill_tag").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  reservePrice: real("reserve_price").notNull().default(5),
  currentBid: real("current_bid").notNull().default(0),
  topBidderId: integer("top_bidder_id"),
  status: text("status").notNull().default("active"),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auctionBidsTable = pgTable("auction_bids", {
  id: serial("id").primaryKey(),
  auctionId: integer("auction_id").notNull(),
  bidderId: integer("bidder_id").notNull(),
  amount: real("amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
