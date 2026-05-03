import type { BlockDefinition, BlockId, UserRole } from "@buildinaus/types"

export const blockRegistry: Record<BlockId, BlockDefinition> = {
  "vc-map": {
    id: "vc-map",
    title: "VC Map",
    description: "Active Australian funds and recent cheque sizes.",
  },
  "jobs-board": {
    id: "jobs-board",
    title: "Jobs Board",
    description: "Roles open at portfolio companies near you.",
  },
  "events-feed": {
    id: "events-feed",
    title: "Events Feed",
    description: "Upcoming meetups, demo days, and pitch nights.",
  },
  "robotics-labs": {
    id: "robotics-labs",
    title: "Robotics Labs",
    description: "University and corporate labs accepting collaborators.",
  },
  "blackbird-grants": {
    id: "blackbird-grants",
    title: "Blackbird Grants",
    description: "Open grants and accelerator deadlines from Blackbird and partners.",
  },
  "founder-leaderboard": {
    id: "founder-leaderboard",
    title: "Founder Leaderboard",
    description: "Most-followed founders shipping right now.",
  },
}

const roleDefaults: Record<UserRole, BlockId[]> = {
  founder: ["vc-map", "blackbird-grants", "events-feed", "founder-leaderboard"],
  operator: ["jobs-board", "events-feed", "founder-leaderboard"],
  investor: ["founder-leaderboard", "vc-map", "events-feed"],
  engineer: ["jobs-board", "robotics-labs", "events-feed"],
  researcher: ["robotics-labs", "blackbird-grants", "events-feed"],
  student: ["jobs-board", "events-feed", "founder-leaderboard"],
}

/**
 * Pick the default block set for a given user role.
 * The agent-engine can override these once it has scraped a real profile.
 */
export function blocksForRole(role: UserRole): BlockDefinition[] {
  return roleDefaults[role].map((id) => blockRegistry[id])
}
