import { HTMLMotionProps, motion } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends HTMLMotionProps<"div"> {
  className?: string;
  children: React.ReactNode;
  intensity?: "low" | "medium" | "high";
}

export function GlassCard({ className, children, intensity = "medium", ...props }: GlassCardProps) {
  const intensities = {
    low: "bg-white/[0.03] backdrop-blur-[15px]",
    medium: "bg-white/[0.05] backdrop-blur-[25px]",
    high: "bg-white/[0.08] backdrop-blur-[40px]"
  };

  return (
    <motion.div
      className={cn(
        "rounded-3xl border-[0.5px] border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden relative",
        intensities[intensity],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
