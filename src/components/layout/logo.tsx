import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 no-underline", className)}>
      <span className="w-8 h-8 rounded-[9px] bg-accent flex items-center justify-center text-white font-extrabold text-base">
        C
      </span>
      <span className="text-ink font-bold text-base">Campus Revenu</span>
    </Link>
  );
}
