/**
 * Atlas — city-level ecosystem guides.
 *
 * Each city is a structured document (sections → groups → items). Server
 * components render it; a client island handles timezone-based auto-detect
 * and the city switcher. Real content will eventually be agent-curated and
 * cached by city + cohort, but the POC ships with editorial seed data.
 */

export type AtlasCitySlug = "sydney" | "melbourne" | "brisbane"

export interface AtlasItem {
  label: string
  href?: string
  description?: string
}

export interface AtlasGroup {
  label?: string
  blurb?: string
  items: AtlasItem[]
}

export interface AtlasSection {
  id: string
  title: string
  blurb?: string
  groups: AtlasGroup[]
}

export interface AtlasCity {
  slug: AtlasCitySlug
  city: string
  state: string
  timezone: string
  tagline: string
  intro: string[]
  stats: { label: string; value: string }[]
  sections: AtlasSection[]
  status: "live" | "scaffolded"
  lastUpdated: string
}

const SYDNEY: AtlasCity = {
  slug: "sydney",
  city: "Sydney",
  state: "NSW",
  timezone: "Australia/Sydney",
  tagline: "The leading startup and venture ecosystem in the Southern Hemisphere.",
  intro: [
    "There's no other city quite like Sydney in Australia when it comes to building tech companies at scale. It's the leading startup and venture ecosystem in the Southern Hemisphere, consistently attracting the majority of Australia's venture capital and producing globally competitive companies.",
    "For its population, Sydney produces an unusually high number of venture-scale outcomes. The ecosystem is dense enough that relationships compound quickly, but small enough that access is earned fast by showing up and building.",
    "Sydney also offers something many global tech hubs struggle with: sustainability. Strong universities, a deep talent pool, access to Asia-Pacific markets, and a lifestyle that supports long-term ambition rather than burnout.",
  ],
  stats: [
    { label: "Ecosystem value", value: "~$55B USD" },
    { label: "Indexed startups", value: "3,000+" },
    { label: "Share of national VC", value: "~65%" },
    { label: "Unicorns per capita", value: "Top 10 globally" },
  ],
  sections: [
    {
      id: "communities",
      title: "Communities & events",
      blurb:
        "Where founders and operators actually meet. Recurring meet-ups, salons, and aggregators worth subscribing to.",
      groups: [
        {
          items: [
            { label: "Startup Strider", href: "https://www.startupstrider.com/" },
            { label: "Lu.ma — Sydney", href: "https://luma.com/discover", description: "Discovery feed for founder events." },
            { label: "Arrayah", href: "https://luma.com/arrayah" },
            { label: "Art of Mondays", href: "https://www.artofmondays.com/" },
            { label: "Humanitix — Sydney tech", href: "https://humanitix.com/us/events/au--nsw--sydney/scienceAndTechnology" },
            { label: "Ripple Social", href: "https://www.instagram.com/ripple.social.sydney/" },
            { label: "HerTechCircle", href: "https://www.hertechcircle.org/events" },
            { label: "Find Your Flock — Sydney", href: "https://findyourflock.co/sydney", description: "Community aggregator." },
            { label: "Startup Circle", href: "https://startupcircle.org/" },
            { label: "The Founders Union", href: "https://www.linkedin.com/company/the-founders-union/" },
            { label: "Inhouse Ventures", href: "https://www.linkedin.com/company/inhouse-ventures/" },
          ],
        },
        {
          label: "Conferences, summits & hackathons",
          items: [
            { label: "Sunrise" },
            { label: "Spark Festival", href: "https://sparkfestival.co/" },
            { label: "LiveHaus", href: "https://thelivehaus.com/" },
            { label: "Startmate Demo Day" },
            { label: "Techstars Demo Day" },
            { label: "S2S Summit", href: "https://www.linkedin.com/company/s2s-summit/" },
            { label: "Australian Technologies Competition", href: "https://www.linkedin.com/company/australian-technologies-competition/" },
          ],
        },
      ],
    },
    {
      id: "programs",
      title: "Startup programs & accelerators",
      blurb:
        "Programs running cohorts in Sydney — pre-accelerators, accelerators, and structured residencies.",
      groups: [
        {
          items: [
            { label: "Arrayah Accelerator", href: "https://arrayah.city/#accelerator" },
            { label: "Startmate — Launch Club", href: "https://www.startmate.com/programs/launch-club", description: "0 to 1." },
            { label: "Startmate — Accelerator", href: "https://www.startmate.com/accelerator/program" },
            { label: "Antler Residency", href: "https://www.antler.co/apply" },
            { label: "Blackbird Giants", href: "https://www.blackbird.vc/giants" },
            { label: "Techstars", href: "https://www.techstars.com/accelerator-hub" },
            { label: "INCUBATE", href: "https://incubate.org.au/" },
            { label: "Founder Institute", href: "https://fi.co/" },
            { label: "UNSW Founders", href: "https://unswfounders.com/pre-accelerator" },
            { label: "Airtree Pioneer", href: "https://www.airtree.vc/pioneer-program" },
            { label: "EnergyLab", href: "https://energylab.org.au/programs/acceleration/" },
            { label: "I2N — Newcastle", href: "https://www.newcastle.edu.au/engage/business-and-industry/integrated-innovation-network-i2n" },
            { label: "LaunchPad", href: "https://launchpadlive.com.au/" },
            { label: "Tech Ready Women Academy", href: "https://www.linkedin.com/company/tech-ready-women/" },
          ],
        },
      ],
    },
    {
      id: "grants",
      title: "Grants & non-dilutive capital",
      blurb:
        "Government and philanthropic capital that doesn't take equity. Most have eligibility windows — read the fine print.",
      groups: [
        {
          items: [
            { label: "Blackbird Protostars", href: "https://www.blackbird.foundation/protostars", description: "$1,000 for 18–25 year olds." },
            { label: "Industry Growth Program", href: "https://www.industry.gov.au/funding-and-incentives/industry-growth-program", description: "Up to $5M." },
            { label: "CSIRO Kick-Start", href: "https://www.csiro.au/en/work-with-us/funding-programs/funding/SME/Kick-Start", description: "$10k–$50k matched." },
            { label: "R&D Tax Incentive", href: "https://www.ato.gov.au/business/research-and-development-tax-incentive/", description: "38.5–43.5% tax offset on eligible R&D spend." },
            { label: "Export Market Development Grants (EMDG)", href: "https://www.austrade.gov.au/EMDG", description: "Up to $770k over multiple years." },
            { label: "Landing Pads", href: "https://landingpads.org/", description: "Non-cash market access." },
            { label: "MVP Ventures (NSW)", href: "https://www.investnsw.com/grants-and-funding/mvp-ventures-program", description: "$25k–$50k matched." },
            { label: "NSW Innovation grants", href: "https://www.investnsw.com/grants-and-funding" },
            { label: "business.gov.au — all programs", href: "https://business.gov.au/grants-and-programs" },
          ],
        },
        {
          label: "Debt financing",
          items: [
            { label: "Prospa", href: "https://www.prospa.com/", description: "Loans up to $500k." },
            { label: "Mighty Partners", href: "https://mightypartners.com/", description: "Revenue-based financing." },
          ],
        },
      ],
    },
    {
      id: "vcs",
      title: "Venture capital",
      blurb: "Funds with a Sydney presence and meaningful local cheque history.",
      groups: [
        {
          items: [
            { label: "Airtree", href: "https://www.airtree.vc/" },
            { label: "Blackbird", href: "https://blackbird.vc/" },
            { label: "Square Peg Capital", href: "https://squarepegcap.com/" },
            { label: "Folklore", href: "https://folklore.vc/" },
            { label: "OneVentures", href: "https://oneventures.com.au/" },
            { label: "Five V Capital", href: "https://www.fivevcapital.com/" },
            { label: "x15 Ventures", href: "https://x15ventures.com/" },
            { label: "Galileo", href: "https://galileoventures.com.au/" },
            { label: "Scalare", href: "https://scalarepartners.com/" },
            { label: "Stoic VC", href: "https://stoicvc.com.au/" },
            { label: "Artesian", href: "https://artesianinvest.com/" },
            { label: "Euphemia", href: "https://euphemia.com/" },
            { label: "Melt Ventures", href: "https://melt.ventures/" },
            { label: "Black Nova", href: "https://blacknova.vc/" },
            { label: "OIF Ventures", href: "https://www.oifventures.com.au/" },
            { label: "Tidal", href: "https://www.tidalvc.com/" },
            { label: "Side Stage Ventures", href: "https://sidestage.vc/" },
            { label: "Flying Fox Ventures", href: "https://flyingfox.vc/" },
            { label: "Giant Leap", href: "https://giantleap.com.au/" },
            { label: "Investible", href: "https://investible.com/" },
            { label: "Main Sequence", href: "https://mainsequence.vc/" },
            { label: "Rampersand", href: "https://rampersand.vc/" },
            { label: "Skip Capital", href: "https://skipcapital.vc/" },
            { label: "Tractor Ventures", href: "https://tractorventures.com/" },
            { label: "Innovation Bay", href: "https://innovationbay.com/" },
            { label: "January Capital", href: "https://www.january.capital/" },
            { label: "EVP", href: "https://www.evp.com.au/" },
            { label: "Brandon Capital", href: "https://brandoncapital.vc/" },
          ],
        },
        {
          label: "Angels & syndicates",
          items: [
            { label: "Aussie Angels", href: "https://www.aussieangels.com/", description: "Angel syndicate." },
            { label: "Airtree open-source investor list", href: "https://www.airtree.vc/open-source-vc/fundraising-in-australia-updated-open-source-investor-list" },
          ],
        },
      ],
    },
    {
      id: "workspaces",
      title: "Workspaces",
      blurb: "Co-working spaces with founder density. Grouped by area.",
      groups: [
        {
          label: "City",
          items: [
            { label: "UTS Startups", href: "https://www.uts.edu.au/for-students/current-students/support/opportunities/uts-startups" },
            { label: "Stone & Chalk", href: "https://www.stoneandchalk.com.au/" },
            { label: "The Commons", href: "https://www.thecommons.com.au/" },
            { label: "Tank Stream Labs", href: "https://www.tankstreamlabs.com/" },
            { label: "Fishburners", href: "https://fishburners.org/" },
            { label: "WorkInc", href: "https://workinc.com.au/" },
            { label: "WeWork — Sydney", href: "https://www.wework.com/l/coworking-space/sydney--NSW" },
          ],
        },
        {
          label: "Surrounding suburbs",
          items: [
            { label: "Cicada Innovations", href: "https://www.cicadainnovations.com/" },
            { label: "Arrayah Coworking", href: "https://arrayah.city/" },
            { label: "UNSW Founders", href: "https://unswfounders.com/" },
            { label: "Workit Spaces", href: "https://workitspaces.com.au/" },
          ],
        },
        {
          label: "Western Sydney",
          items: [
            { label: "Spacecubed Western Sydney Hub", href: "https://hello.spacecubed.com/western-sydney-startup-hub" },
          ],
        },
        {
          label: "Maker spaces",
          items: [{ label: "ACES", href: "https://acesociety.co/" }],
        },
        {
          label: "Commercial leasing",
          blurb:
            "Brokers founders actually use when graduating from coworking into a first or second office.",
          items: [
            { label: "Savills Australia", href: "https://www.savills.com.au/", description: "Flexible sub-leases, smaller floor plates." },
            { label: "JLL Australia", href: "https://www.jll.com.au/", description: "Growth-stage offices, short-to-medium terms." },
            { label: "CBRE Australia", href: "https://www.cbre.com.au/", description: "Large inventory, value space." },
            { label: "Knight Frank", href: "https://www.knightfrank.com.au/", description: "Boutique, creative, Surry Hills / Darlinghurst." },
            { label: "Colliers", href: "https://www.colliers.com/en-au", description: "HQ-grade, lease-structure advisory." },
          ],
        },
      ],
    },
    {
      id: "cafes",
      title: "Cafés & meeting spots",
      blurb: "Where 1:1s happen. Loosely grouped by purpose.",
      groups: [
        {
          label: "Founder favourites",
          items: [
            { label: "Single O — Surry Hills" },
            { label: "AP House — Surry Hills" },
            { label: "Paramount Coffee Project" },
            { label: "Grosvenor Place Lobby" },
            { label: "Home Croissanterie" },
            { label: "Brewtown — Newtown" },
            { label: "The Fullerton Lobby" },
            { label: "Edition Coffee Roasters" },
            { label: "Beta Coffee — Redfern" },
          ],
        },
        {
          label: "Heads-down work",
          items: [
            { label: "Green Square library" },
            { label: "State Library of NSW" },
            { label: "Australia Square outdoor seating" },
            { label: "Stone & Chalk free coworking" },
          ],
        },
        {
          label: "Walking-meeting routes",
          items: [
            { label: "Darling Harbour waterfront loop" },
            { label: "Barangaroo Reserve & Foreshore" },
            { label: "Circular Quay → Opera House" },
            { label: "Bay Run (Iron Cove loop)" },
            { label: "Coogee → Bondi coastal walk" },
            { label: "Spit → Manly" },
          ],
        },
        {
          label: "Quiet spots for serenity",
          items: [
            { label: "Royal Botanic Gardens" },
            { label: "Wendy Whiteley's Secret Garden" },
            { label: "Cockatoo Island" },
            { label: "Dudley Page Reserve" },
            { label: "Giba Park — Pyrmont" },
          ],
        },
        {
          label: "Beer afterwards",
          items: [
            { label: "Opera Bar" },
            { label: "Heaps Normal Health Club" },
            { label: "Bob Hawke Beer Hall" },
            { label: "The Old Clare" },
            { label: "Cirq, Barangaroo Crown" },
            { label: "Hotel Palisade" },
            { label: "Inner West Ale Trail", href: "https://innerwestaletrail.com/" },
          ],
        },
      ],
    },
    {
      id: "housing",
      title: "Housing & co-living",
      blurb: "Founder-friendly co-living houses worth knowing about.",
      groups: [
        {
          items: [
            { label: "Billabong (Arrayah)" },
            { label: "Banksia (Arrayah)" },
            { label: "Urban Village — Inner West" },
            { label: "Lyf — Bondi", href: "https://www.discoverasr.com/en/lyf/australia/lyf-bondi-junction-sydney" },
          ],
        },
      ],
    },
    {
      id: "visiting",
      title: "Visiting from out of town",
      blurb:
        "Sydney's strength isn't sheer scale — it's how quickly relationships compound. Front-load before the trip and cluster meetings by area.",
      groups: [
        {
          label: "Networking",
          items: [
            { label: "Set up first-half meetings before you arrive", description: "DM on LinkedIn — warm intros beat cold." },
            { label: "RSVP events early", description: "Founder/VC events cap numbers low." },
            { label: "Co-work in tech spaces", description: "Sydney is social by default; serendipity matters." },
          ],
        },
        {
          label: "Logistics",
          items: [
            { label: "Public transport is capped", description: "AU$19.30 Mon–Thu, $9.65 Fri–Sun." },
            { label: "Driving = traffic + parking", description: "Add buffer time between meetings." },
            { label: "Stay near hubs", description: "Surry Hills, Darlinghurst, CBD if your meetings cluster there." },
          ],
        },
      ],
    },
    {
      id: "immigration",
      title: "Immigration",
      blurb:
        "Australia is one of the most immigrant-driven startup ecosystems in the world. These are the visa pathways and resources founders rely on.",
      groups: [
        {
          label: "Common pathways",
          items: [
            { label: "Temporary Skill Shortage (TSS 482)", description: "Employer-sponsored — early hires and operators." },
            { label: "Global Talent (Subclass 858)", description: "Highly skilled founders, engineers, researchers." },
            { label: "Skilled Independent / State-Nominated (189 / 190)" },
            { label: "Business Innovation & Investment", description: "Legacy pathways still relevant for some founders." },
          ],
        },
        {
          label: "Resources",
          items: [
            { label: "immi.homeaffairs.gov.au", href: "https://immi.homeaffairs.gov.au/", description: "Official portal." },
            { label: "Lighthouse HQ", href: "https://www.lighthousehq.com/", description: "High-signal immigration support for global technologists." },
            { label: "Franklin Migration", href: "https://www.franklinmigration.com.au/", description: "Popular with venture-backed founders." },
            { label: "Visa Lawyers Australia", href: "https://www.visalawyers.com.au/" },
            { label: "Global Talent program", href: "https://www.globaltalent.gov.au/" },
            { label: "TechVisa", href: "https://techvisa.com.au/", description: "Visas for tech companies." },
            { label: "StartupAUS", href: "https://www.startupaus.org/", description: "Advocacy for founder visa pathways." },
          ],
        },
      ],
    },
  ],
  status: "live",
  lastUpdated: "2026-04-30",
}

const MELBOURNE: AtlasCity = {
  slug: "melbourne",
  city: "Melbourne",
  state: "VIC",
  timezone: "Australia/Melbourne",
  tagline:
    "Australia's strongest open-source and dev-tools community, with deep biotech and design talent.",
  intro: [
    "Melbourne's tech ecosystem is shaped by its universities, its open-source community, and a deep design and creative talent pool. Founders here ship dev tools, biotech, and consumer products with a craftsmanship streak that's hard to fake.",
    "What it lacks in raw VC volume compared to Sydney, it makes up for in density of working engineers, lower cost of operation, and a tight community of repeat founders.",
  ],
  stats: [
    { label: "Dev-tools cluster", value: "APAC's largest" },
    { label: "Biotech precincts", value: "Parkville + Clayton" },
    { label: "Universities", value: "8" },
    { label: "Coffee shops per capita", value: "🥇" },
  ],
  sections: [
    {
      id: "communities",
      title: "Communities & events",
      blurb: "Recurring meetups and community pages worth subscribing to.",
      groups: [
        {
          items: [
            { label: "Melbourne AI Tinkerers" },
            { label: "Higher Order — CBD" },
            { label: "Melb Open Source Group" },
            { label: "Yarra Founders" },
          ],
        },
      ],
    },
    {
      id: "programs",
      title: "Startup programs",
      groups: [
        {
          items: [
            { label: "Startmate — Melbourne", href: "https://www.startmate.com/" },
            { label: "Antler Melbourne", href: "https://www.antler.co/apply" },
            { label: "Melbourne Accelerator Program (MAP)" },
            { label: "RMIT Activator" },
          ],
        },
      ],
    },
    {
      id: "vcs",
      title: "Venture capital",
      groups: [
        {
          items: [
            { label: "Square Peg Capital", href: "https://squarepegcap.com/" },
            { label: "AfterWork Ventures" },
            { label: "Tidal", href: "https://www.tidalvc.com/" },
            { label: "Carthona Capital" },
          ],
        },
      ],
    },
    {
      id: "workspaces",
      title: "Workspaces",
      groups: [
        {
          items: [
            { label: "Higher Order" },
            { label: "Inspire9 — Richmond" },
            { label: "WeWork — Bourke St" },
            { label: "Melbourne Connect" },
          ],
        },
      ],
    },
  ],
  status: "scaffolded",
  lastUpdated: "2026-04-30",
}

const BRISBANE: AtlasCity = {
  slug: "brisbane",
  city: "Brisbane",
  state: "QLD",
  timezone: "Australia/Brisbane",
  tagline:
    "Australia's fastest-growing climate, robotics, and reef-tech ecosystem — close to the talent that builds physical things.",
  intro: [
    "Brisbane's edge is its proximity to working agriculture, the Great Barrier Reef, and one of the country's strongest robotics research clusters at UQ. Founders here ship hardware-software hybrids — robotics, climate, agtech, marine — at a cost base Sydney can't match.",
  ],
  stats: [
    { label: "Robotics labs", value: "UQ + QUT" },
    { label: "Climate tech share", value: "Highest in AU" },
    { label: "Cost vs Sydney", value: "−25%" },
  ],
  sections: [
    {
      id: "communities",
      title: "Communities & events",
      groups: [
        {
          items: [
            { label: "Brisbane Climate Tech Mixer" },
            { label: "QLD Founders" },
            { label: "Fishburners BNE" },
          ],
        },
      ],
    },
    {
      id: "programs",
      title: "Startup programs",
      groups: [
        {
          items: [
            { label: "ilab — UQ" },
            { label: "QUT Foundry" },
            { label: "Startmate — Brisbane", href: "https://www.startmate.com/" },
          ],
        },
      ],
    },
    {
      id: "vcs",
      title: "Venture capital",
      groups: [
        {
          items: [
            { label: "Tenacious Ventures" },
            { label: "Investible", href: "https://investible.com/" },
            { label: "Black Sheep Capital" },
          ],
        },
      ],
    },
    {
      id: "workspaces",
      title: "Workspaces",
      groups: [
        {
          items: [
            { label: "Fishburners BNE" },
            { label: "The Capital — Brisbane" },
            { label: "Hopkins Institute" },
          ],
        },
      ],
    },
  ],
  status: "scaffolded",
  lastUpdated: "2026-04-30",
}

export const ATLAS: Record<AtlasCitySlug, AtlasCity> = {
  sydney: SYDNEY,
  melbourne: MELBOURNE,
  brisbane: BRISBANE,
}

export const ATLAS_CITIES = [SYDNEY, MELBOURNE, BRISBANE]

export function getAtlasCity(slug: string): AtlasCity | undefined {
  return ATLAS[slug as AtlasCitySlug]
}

const TZ_TO_CITY: Record<string, AtlasCitySlug> = {
  "Australia/Sydney": "sydney",
  "Australia/Melbourne": "melbourne",
  "Australia/Hobart": "melbourne",
  "Australia/Adelaide": "melbourne",
  "Australia/Brisbane": "brisbane",
}

/**
 * Best-effort city detection from the browser's IANA timezone.
 * Returns `undefined` when run on the server or when the timezone doesn't
 * map — the caller decides the fallback.
 */
export function detectCityFromTimezone(): AtlasCitySlug | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return TZ_TO_CITY[tz]
  } catch {
    return undefined
  }
}
