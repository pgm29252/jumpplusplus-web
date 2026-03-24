import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function getRoleColor(role: string) {
  switch (role) {
    case "ADMIN":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "MODERATOR":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-sky-100 text-sky-700 border-sky-200";
  }
}
