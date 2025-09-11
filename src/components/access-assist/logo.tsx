import * as React from "react";

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
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
      className="h-6 w-6 text-primary"
      {...props}
    >
      <path d="M12 12m-3 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0" />
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M22 12c0 4-2.5 7.5-6 9" />
    </svg>
  );
}
