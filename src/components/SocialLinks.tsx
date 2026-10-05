import { SOCIAL_LINKS } from "@/lib/site";

export default function SocialLinks({
  size = 18,
  className = "",
  itemClassName = "",
}: {
  size?: number;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ul className={`flex items-center gap-1 ${className}`}>
      {SOCIAL_LINKS.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            title={s.label}
            className={`inline-flex items-center justify-center rounded-md p-2 transition-colors ${itemClassName}`}
          >
            <svg
              width={size}
              height={size}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d={s.path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
