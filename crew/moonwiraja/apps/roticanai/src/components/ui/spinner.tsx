import { cn } from "@/lib/ui/utils";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <output className={cn("animate-spin", className)} aria-label="Loading">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-full h-full"
        aria-hidden="true"
      >
        <title>Loading spinner</title>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    </output>
  );
}
