"use client";

import { useState } from "react";
import { getAvatarColor, getInitials } from "@/lib/avatar";

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-[52px] h-[52px] text-base", // Increased from 40px to 52px
  lg: "w-[52px] h-[52px] text-[17px]",
};

export function Avatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const color = getAvatarColor(name);
  const initials = getInitials(name);

  // Use image if available and not errored
  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        onError={() => setImageError(true)}
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      />
    );
  }

  // Fallback to colored initials
  return (
    <span
      className={`rounded-full grid place-items-center text-white font-semibold font-mono ${sizeClasses[size]} ${className}`}
      style={{ background: color }}
    >
      {initials}
    </span>
  );
}
