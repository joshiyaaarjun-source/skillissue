import { cn } from "@/lib/utils";

interface SkillTagProps {
  skill: string;
  type: "offered" | "wanted";
  isOverlapping?: boolean;
}

export default function SkillTag({ skill, type, isOverlapping }: SkillTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
        type === "offered" && "bg-[#ffd9d9] text-[#4d0011]",
        type === "wanted" && "bg-transparent border border-[#bd7880] text-[#1a0008] dark:text-[#ffd9d9]",
        isOverlapping && "ring-2 ring-[#4d0011] ring-offset-1 ring-offset-background shadow-[0_0_10px_rgba(77,0,17,0.5)]"
      )}
    >
      {skill}
    </span>
  );
}
