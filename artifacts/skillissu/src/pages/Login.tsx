import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function Login() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#4d0011] text-[#ffd9d9] p-6 overflow-hidden relative">
      {/* Abstract background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#bd7880] rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#ffd9d9] rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center text-center max-w-md w-full"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 bg-[#ffd9d9] rounded-3xl mb-8 flex items-center justify-center shadow-2xl rotate-3"
        >
          <span className="text-[#4d0011] text-4xl font-bold font-serif italic">S</span>
        </motion.div>
        
        <h1 className="text-5xl font-extrabold tracking-tight mb-4 text-white">
          Skillissu
        </h1>
        <p className="text-xl mb-12 text-[#ffd9d9]/80 font-medium">
          Trade what you know.<br/>Learn what you love.
        </p>

        <Link href="/dashboard" className="w-full block">
          <Button 
            size="lg" 
            className="w-full h-14 bg-white text-[#4d0011] hover:bg-[#ffd9d9] text-lg font-bold rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Continue with Google
          </Button>
        </Link>
        
        <p className="mt-8 text-sm text-[#ffd9d9]/60">
          By continuing, you agree to trade skills fairly.
        </p>
      </motion.div>
    </div>
  );
}
