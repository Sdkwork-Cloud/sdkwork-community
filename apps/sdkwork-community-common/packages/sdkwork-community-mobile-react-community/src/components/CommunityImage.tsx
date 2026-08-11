import React, { useState } from "react";

/**
 * Community image with a guaranteed-visible fallback.
 *
 * Seed circles reference remote placeholder assets; in restricted networks
 * (WeChat X5, mainland China) remote hosts can be unreachable or slow. When
 * the image fails to load (or no src is provided) this component renders a
 * deterministic inline SVG placeholder (brand color + first character of the
 * seed) so avatars and covers are never an empty/broken box.
 */

export type CommunityImageKind = "avatar" | "cover";

function buildFallbackSvg(seed: string, kind: CommunityImageKind): string {
  const initial = (seed || "圈").trim().charAt(0) || "圈";
  const width = kind === "avatar" ? 160 : 800;
  const height = kind === "avatar" ? 160 : 400;
  const fontSize = kind === "avatar" ? 72 : 120;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect width="100%" height="100%" fill="#2B5CE7"/>` +
    `<text x="50%" y="50%" font-family="system-ui,-apple-system,sans-serif" ` +
    `font-size="${fontSize}" font-weight="600" fill="#ffffff" ` +
    `text-anchor="middle" dominant-baseline="central">${initial}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface CommunityImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  /** Text used to derive the fallback placeholder (name preferred). */
  fallbackSeed?: string;
  kind?: CommunityImageKind;
}

export const CommunityImage: React.FC<CommunityImageProps> = ({
  src,
  alt,
  className,
  fallbackSeed,
  kind = "avatar",
}) => {
  const [failed, setFailed] = useState(false);
  const effectiveSrc =
    src && !failed ? src : buildFallbackSvg(fallbackSeed ?? alt ?? "", kind);
  return (
    <img
      src={effectiveSrc}
      alt={alt ?? ""}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};
