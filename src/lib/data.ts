import type { Asset, Folder, Team } from "./types";

export const TEAMS: Team[] = [
  { id: "sea", name: "Seahawks", abbr: "SEA", city: "Seattle", primary: "#002244", secondary: "#69BE28" },
  { id: "kc", name: "Chiefs", abbr: "KC", city: "Kansas City", primary: "#E31837", secondary: "#FFB81C" },
  { id: "phi", name: "Eagles", abbr: "PHI", city: "Philadelphia", primary: "#004C54", secondary: "#A5ACAF" },
  { id: "sf", name: "49ers", abbr: "SF", city: "San Francisco", primary: "#AA0000", secondary: "#B3995D" },
  { id: "buf", name: "Bills", abbr: "BUF", city: "Buffalo", primary: "#00338D", secondary: "#C60C30" },
  { id: "dal", name: "Cowboys", abbr: "DAL", city: "Dallas", primary: "#041E42", secondary: "#869397" },
  { id: "det", name: "Lions", abbr: "DET", city: "Detroit", primary: "#0076B6", secondary: "#B0B7BC" },
  { id: "bal", name: "Ravens", abbr: "BAL", city: "Baltimore", primary: "#241773", secondary: "#9E7C0C" },
];

const ROSTERS: Record<string, { player: string; number: string; position: string }[]> = {
  sea: [
    { player: "Geno Smith", number: "7", position: "QB" },
    { player: "DK Metcalf", number: "14", position: "WR" },
    { player: "Tyler Lockett", number: "16", position: "WR" },
    { player: "Kenneth Walker III", number: "9", position: "RB" },
    { player: "Devon Witherspoon", number: "21", position: "CB" },
    { player: "Julian Love", number: "20", position: "S" },
  ],
  kc: [
    { player: "Patrick Mahomes", number: "15", position: "QB" },
    { player: "Travis Kelce", number: "87", position: "TE" },
    { player: "Chris Jones", number: "95", position: "DT" },
    { player: "Isiah Pacheco", number: "10", position: "RB" },
    { player: "Rashee Rice", number: "4", position: "WR" },
  ],
  phi: [
    { player: "Jalen Hurts", number: "1", position: "QB" },
    { player: "A.J. Brown", number: "11", position: "WR" },
    { player: "DeVonta Smith", number: "6", position: "WR" },
    { player: "Saquon Barkley", number: "26", position: "RB" },
    { player: "Lane Johnson", number: "65", position: "OT" },
  ],
  sf: [
    { player: "Brock Purdy", number: "13", position: "QB" },
    { player: "Christian McCaffrey", number: "23", position: "RB" },
    { player: "Nick Bosa", number: "97", position: "DE" },
    { player: "George Kittle", number: "85", position: "TE" },
    { player: "Deebo Samuel", number: "1", position: "WR" },
  ],
  buf: [
    { player: "Josh Allen", number: "17", position: "QB" },
    { player: "Stefon Diggs", number: "1", position: "WR" },
    { player: "James Cook", number: "4", position: "RB" },
    { player: "Von Miller", number: "40", position: "LB" },
    { player: "Matt Milano", number: "58", position: "LB" },
  ],
  dal: [
    { player: "Dak Prescott", number: "4", position: "QB" },
    { player: "CeeDee Lamb", number: "88", position: "WR" },
    { player: "Micah Parsons", number: "11", position: "LB" },
    { player: "Trevon Diggs", number: "7", position: "CB" },
    { player: "Brandin Cooks", number: "3", position: "WR" },
  ],
  det: [
    { player: "Jared Goff", number: "16", position: "QB" },
    { player: "Amon-Ra St. Brown", number: "14", position: "WR" },
    { player: "Jahmyr Gibbs", number: "0", position: "RB" },
    { player: "Aidan Hutchinson", number: "97", position: "DE" },
    { player: "Sam LaPorta", number: "87", position: "TE" },
  ],
  bal: [
    { player: "Lamar Jackson", number: "8", position: "QB" },
    { player: "Mark Andrews", number: "89", position: "TE" },
    { player: "Zay Flowers", number: "4", position: "WR" },
    { player: "Roquan Smith", number: "0", position: "LB" },
    { player: "Derrick Henry", number: "22", position: "RB" },
  ],
};

export const FOLDERS: Folder[] = [
  { id: "root", name: "Photo Shelter", parentId: null, headshotWorkflow: false },
  { id: "hs-2025", name: "2025 NFL Headshots", parentId: "root", headshotWorkflow: true },
  { id: "portraits-2025", name: "2025 Portraits", parentId: "root", headshotWorkflow: false },
  { id: "action-2025", name: "2025 Action / Game", parentId: "root", headshotWorkflow: false },
  { id: "collections", name: "Collections", parentId: "root", headshotWorkflow: false },
  ...TEAMS.map((t) => ({
    id: `hs-2025-${t.id}`,
    name: `${t.city} ${t.name}`,
    parentId: "hs-2025",
    headshotWorkflow: true,
    teamId: t.id,
  })),
  { id: "col-social", name: "Social daily support", parentId: "collections", headshotWorkflow: false },
  { id: "col-plus", name: "NFL Plus cutouts", parentId: "collections", headshotWorkflow: false },
];

function assetId(prefix: string, i: number) {
  return `${prefix}-${i}`;
}

export const ASSETS: Asset[] = [];

let n = 0;
for (const team of TEAMS) {
  for (const player of ROSTERS[team.id]) {
    n += 1;
    ASSETS.push({
      id: assetId("hs", n),
      name: `${player.player} · 2025 headshot`,
      kind: "headshot",
      source: "photoshelter",
      teamId: team.id,
      player: player.player,
      number: player.number,
      position: player.position,
      year: 2025,
      folderId: `hs-2025-${team.id}`,
      width: 2400,
      height: 3000,
      bytes: 4_200_000 + n * 1300,
      takenAt: "2025-07-22",
    });
  }
}

const portraitSeeds = [
  { teamId: "sea", player: "Geno Smith", folderId: "portraits-2025" },
  { teamId: "kc", player: "Patrick Mahomes", folderId: "portraits-2025" },
  { teamId: "phi", player: "Jalen Hurts", folderId: "portraits-2025" },
  { teamId: "bal", player: "Lamar Jackson", folderId: "portraits-2025" },
];
portraitSeeds.forEach((p, i) => {
  ASSETS.push({
    id: assetId("pt", i + 1),
    name: `${p.player} · studio portrait`,
    kind: "portrait",
    source: "photoshelter",
    teamId: p.teamId,
    player: p.player,
    year: 2025,
    folderId: p.folderId,
    width: 3200,
    height: 4000,
    bytes: 6_100_000,
    takenAt: "2025-08-03",
  });
});

const actionSeeds = [
  { teamId: "sea", player: "DK Metcalf", caption: "Metcalf stretches for the sideline" },
  { teamId: "kc", player: "Patrick Mahomes", caption: "Mahomes scrambles vs. Buffalo" },
  { teamId: "phi", player: "Saquon Barkley", caption: "Barkley breaks into the secondary" },
  { teamId: "det", player: "Amon-Ra St. Brown", caption: "St. Brown toe-tap at the boundary" },
  { teamId: "buf", player: "Josh Allen", caption: "Allen launches downfield" },
  { teamId: "sf", player: "Christian McCaffrey", caption: "McCaffrey cuts upfield" },
];
actionSeeds.forEach((a, i) => {
  ASSETS.push({
    id: assetId("ac", i + 1),
    name: a.caption,
    kind: "action",
    source: "photoshelter",
    teamId: a.teamId,
    player: a.player,
    caption: a.caption,
    year: 2025,
    folderId: i < 3 ? "action-2025" : "col-social",
    width: 4928,
    height: 3280,
    bytes: 8_400_000,
    takenAt: "2025-09-14",
  });
});

function makeApAsset(i: number, teamId: string): Asset {
  const team = teamById(teamId)!;
  const roster = ROSTERS[team.id];
  const player = roster[i % roster.length];
  const seattle = team.id === "sea";
  return {
    id: assetId("ap", i + 1),
    name: `${team.city} ${team.name} · ${player.player}`,
    kind: i % 7 === 0 ? "action" : "headshot",
    source: "ap",
    teamId: team.id,
    player: player.player,
    number: player.number,
    position: player.position,
    caption: seattle
      ? `Seattle ${player.player} (${player.position}) — AP Images`
      : `${player.player} ${team.abbr} — AP Images`,
    year: 2025,
    folderId: "ap",
    width: 3600,
    height: 2400,
    bytes: 5_200_000,
    takenAt: "2025-10-0" + ((i % 9) + 1),
  };
}

const apMain = Array.from({ length: 96 }, (_, i) =>
  makeApAsset(i, TEAMS[i % TEAMS.length].id),
);
const apSeattle = Array.from({ length: 36 }, (_, i) =>
  makeApAsset(200 + i, "sea"),
);
export const AP_ASSETS: Asset[] = [...apMain, ...apSeattle];

export const OFFICES = [
  "Media Design",
  "Social Marketing",
  "Digital",
  "NFL Plus",
  "NY HQ",
  "LA Studio",
] as const;

export const PEOPLE = [
  "Shawn Baden",
  "Cari Chadwick",
  "Dustin",
  "Lucas Flora",
  "Robin",
  "Courtney",
] as const;

export const ANALYTICS = {
  liveMonths: 6,
  jobs: 3128,
  images: 29147,
  successRate: 0.984,
  avgJobMinutes: 4.6,
  spendUsd: 181,
  savedUsd: 267000,
  baseline: {
    teams: 32,
    headshots: 3900,
    designers: 3,
    hoursBefore: 360,
    humansAfter: 1,
    hoursAfter: 2,
  },
  byType: [
    { label: "Headshots", value: 18420 },
    { label: "Portraits", value: 3120 },
    { label: "Action stills", value: 4890 },
    { label: "Rotoscope / movie", value: 2717 },
  ],
  byOffice: [
    { label: "Media Design", value: 1420 },
    { label: "Social Marketing", value: 610 },
    { label: "Digital", value: 480 },
    { label: "NFL Plus", value: 318 },
    { label: "NY HQ", value: 190 },
    { label: "LA Studio", value: 110 },
  ],
  byPerson: [
    { label: "Shawn Baden", value: 980 },
    { label: "Cari Chadwick", value: 640 },
    { label: "Dustin", value: 510 },
    { label: "Lucas Flora", value: 420 },
    { label: "Robin", value: 310 },
    { label: "Courtney", value: 268 },
  ],
  monthly: [
    { label: "Nov", jobs: 210, images: 1980 },
    { label: "Dec", jobs: 280, images: 2410 },
    { label: "Jan", jobs: 340, images: 3120 },
    { label: "Feb", jobs: 410, images: 3890 },
    { label: "Mar", jobs: 520, images: 4720 },
    { label: "Apr", jobs: 1368, images: 13027 },
  ],
  failures: [
    { day: "Mar 12", count: 4 },
    { day: "Mar 28", count: 2 },
    { day: "Apr 9", count: 18 },
    { day: "Apr 17", count: 3 },
    { day: "Apr 22", count: 1 },
  ],
};

export function teamById(id?: string) {
  return TEAMS.find((t) => t.id === id);
}

export function folderById(id: string) {
  return FOLDERS.find((f) => f.id === id);
}

export function childrenOf(id: string) {
  return FOLDERS.filter((f) => f.parentId === id);
}

export function assetsInFolder(folderId: string): Asset[] {
  const ids = new Set<string>();
  const walk = (id: string) => {
    ids.add(id);
    childrenOf(id).forEach((c) => walk(c.id));
  };
  walk(folderId);
  return ASSETS.filter((a) => ids.has(a.folderId));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
