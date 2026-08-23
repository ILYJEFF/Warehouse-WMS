import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link href={href} className="back-btn">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}
