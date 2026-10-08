import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Handshake, Sparkles } from "lucide-react";

export default function Login() {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#f5eee8] text-[#431a2a]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.24]" style={{ backgroundImage: "radial-gradient(#a47579 0.7px, transparent 0.7px)", backgroundSize: "18px 18px" }} />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-7xl flex-col px-5 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#741f37] text-[#f8e8df] shadow-md shadow-[#741f37]/15">
              <span className="font-serif text-xl font-bold italic">S</span>
            </div>
            <span className="text-[15px] font-extrabold tracking-[-0.04em]">skillissue</span>
          </div>
          <span className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-[#8e6c70] sm:block">A better way to get good</span>
        </header>

        <main className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.08fr_.92fr] lg:gap-20">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#d9b3a7]/45 blur-3xl" />
            <div className="relative mb-7 inline-flex items-center gap-2 rounded-full border border-[#d8c2b8] bg-[#fffaf5]/75 px-3.5 py-2 text-xs font-semibold text-[#76545d]">
              <Sparkles size={14} className="text-[#a4515e]" /> Skills are better shared
            </div>
            <h1 className="relative max-w-2xl font-serif text-[clamp(3.4rem,8vw,6.8rem)] font-medium leading-[.94] tracking-[-0.055em] text-[#4a1b2d]">
              Learn from people. <em className="text-[#a4515e]">Teach what you know.</em>
            </h1>
            <p className="relative mt-7 max-w-lg text-base leading-7 text-[#765e61] sm:text-lg">
              Find your people, trade know-how, and make progress together. No gatekeeping. Just good exchanges.
            </p>
            <div className="mt-10 flex items-center gap-4 text-sm font-semibold text-[#76545d]">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d7b7b0] bg-[#f8e4dc] text-[#741f37]">
                <Handshake size={19} />
              </div>
              <span>We swiped right on skills.</span>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.7, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="absolute -right-7 -top-8 hidden h-24 w-24 rounded-full border border-[#d7b7b0] sm:block" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[#eadbd2] bg-[#fffaf7] p-7 shadow-[0_24px_70px_rgba(87,43,48,0.12)] sm:p-10">
              <div className="mb-9 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a4515e]">Your next chapter</p>
                  <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-[#4a1b2d]">Start with a skill.</h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f5e7df] text-[#741f37]">
                  <span className="font-serif text-xl font-bold italic">S</span>
                </span>
              </div>
              <p className="mb-8 text-sm leading-6 text-[#80686a]">
                Meet curious people who want to learn what you can teach — and share what you want to learn.
              </p>
              <Link href="/onboarding" className="block w-full">
                <Button
                  size="lg"
                  className="group h-14 w-full rounded-2xl bg-[#741f37] text-base font-bold text-[#fff8f2] shadow-[0_9px_22px_rgba(116,31,55,0.2)] transition-colors hover:bg-[#5f182d]"
                >
                  Continue with Google
                  <ArrowUpRight size={18} className="ml-2 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#927a7b]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7a9a7e]" />
                By continuing, you agree to trade skills fairly.
              </div>
            </div>
            <p className="mt-5 text-center text-[11px] font-medium tracking-wide text-[#927a7b]">A little knowledge goes a long way.</p>
          </motion.section>
        </main>
        <footer className="flex items-center justify-between border-t border-[#dfcec5] py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#987f7c]">
          <span>Skillissu</span>
          <span>Learn · Share · Grow</span>
        </footer>
      </div>
    </div>
  );
}
