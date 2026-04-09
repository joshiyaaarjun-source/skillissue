import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useLocation } from "wouter";

const MESSAGES = [
  "Someone nearby is learning React. You could teach that.",
  "You have had 50 credits sitting there for 3 days. Are you collecting or learning?",
  "You are on a 5-day streak! Keep the momentum - legends do not stop here!"
];

export default function FakeNotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [location] = useLocation();

  useEffect(() => {
    if (location === "/") return;

    const showTimer = setTimeout(() => {
      setIsVisible(true);
      
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
      }, 4000);
      
      return () => clearTimeout(hideTimer);
    }, 3000);

    return () => clearTimeout(showTimer);
  }, [location, messageIndex]);

  return (
    <AnimatePresence>
      {isVisible && location !== "/" && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-4 left-4 right-4 z-50 pointer-events-none"
        >
          <div 
            className="mx-auto max-w-md rounded-xl p-4 shadow-lg flex items-start gap-3"
            style={{ backgroundColor: "#102b1f", color: "white" }}
          >
            <Bell className="h-5 w-5 mt-0.5 text-[#ffd9d9] shrink-0" />
            <p className="text-sm font-medium leading-tight">
              {MESSAGES[messageIndex]}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
