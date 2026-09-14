import { teamById } from "./data";

type Props = {
  name?: string;
  number?: string;
  teamId?: string;
  cutout?: boolean;
  aligned?: boolean;
  kind?: "headshot" | "portrait" | "action" | "movie";
};

export function Portrait({
  name = "Player",
  number = "0",
  teamId,
  cutout = false,
  aligned = false,
  kind = "headshot",
}: Props) {
  const team = teamById(teamId);
  const primary = team?.primary ?? "#1a1a1a";
  const secondary = team?.secondary ?? "#c8a24a";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  const pupilY = aligned ? 78 : 74;
  const uid = `${name}-${number}-${teamId ?? "x"}`.replace(/\W+/g, "");

  return (
    <svg
      viewBox="0 0 200 240"
      className="h-full w-full"
      role="img"
      aria-label={name}
    >
      {cutout ? (
        <>
          <defs>
            <pattern
              id={`ck-${uid}`}
              width="16"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <rect width="16" height="16" fill="#d9d9d9" />
              <rect width="8" height="8" fill="#f4f4f4" />
              <rect x="8" y="8" width="8" height="8" fill="#f4f4f4" />
            </pattern>
          </defs>
          <rect width="200" height="240" fill={`url(#ck-${uid})`} />
        </>
      ) : (
        <rect
          width="200"
          height="240"
          fill={kind === "action" ? "#0e3b22" : primary}
        />
      )}
      {kind === "action" && !cutout && (
        <ellipse cx="160" cy="200" rx="70" ry="28" fill="#147a3a" opacity="0.5" />
      )}
      {kind === "movie" && (
        <rect x="12" y="18" width="176" height="120" rx="6" fill="#0b0b0b" />
      )}
      <ellipse cx="100" cy="210" rx="62" ry="28" fill={cutout ? "#1b1b1b" : "#111"} />
      <rect x="58" y="128" width="84" height="90" rx="18" fill={primary} />
      <rect x="58" y="128" width="84" height="18" fill={secondary} opacity="0.85" />
      <circle cx="100" cy="92" r="36" fill="#e8c7a8" />
      <ellipse cx="100" cy="78" rx="28" ry="16" fill="#2a2118" />
      <circle cx="88" cy={pupilY} r="3.2" fill="#1a120c" />
      <circle cx="112" cy={pupilY} r="3.2" fill="#1a120c" />
      {aligned && (
        <>
          <line
            x1="20"
            y1={pupilY}
            x2="180"
            y2={pupilY}
            stroke="#69BE28"
            strokeWidth="1"
            opacity="0.75"
          />
          <circle cx="88" cy={pupilY} r="6" fill="none" stroke="#69BE28" strokeWidth="1.2" />
          <circle cx="112" cy={pupilY} r="6" fill="none" stroke="#69BE28" strokeWidth="1.2" />
        </>
      )}
      <text
        x="100"
        y="176"
        textAnchor="middle"
        fill={secondary}
        fontSize="22"
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui"
      >
        {number}
      </text>
      <text
        x="100"
        y="228"
        textAnchor="middle"
        fill={cutout ? "#222" : "#fff"}
        fontSize="11"
        fontFamily="ui-sans-serif, system-ui"
        opacity="0.9"
      >
        {initials}
      </text>
    </svg>
  );
}
