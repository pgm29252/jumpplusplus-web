import { Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
};

export default function BrandLogo({
  className,
  iconClassName,
  textClassName,
  showText = true,
}: BrandLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-emerald-800 via-emerald-700 to-teal-600 shadow-lg shadow-emerald-900/20 ring-1 ring-white/40 backdrop-blur-sm",
          iconClassName,
        )}
      >
        <Sprout className="h-4 w-4 text-white" />
      </div>
      {showText && (
        <span
          className={cn(
            "bg-linear-to-r from-emerald-800 via-emerald-700 to-teal-600 bg-clip-text font-bold text-transparent",
            textClassName,
          )}
        >
          JumpPlusPlus
        </span>
      )}
    </div>
  );
}