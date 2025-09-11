import { cn } from "@/lib/utils";
import React from "react";

interface AnimatedAvatarProps {
  children: React.ReactNode;
  className?: string;
}

export function AnimatedAvatar({ children, className }: AnimatedAvatarProps) {
  return (
    <div
      className={cn(
        "relative rounded-full p-1 bg-gradient-to-br from-accent to-primary",
        className
      )}
    >
      <div className="bg-card rounded-full p-0.5">{children}</div>
    </div>
  );
}
