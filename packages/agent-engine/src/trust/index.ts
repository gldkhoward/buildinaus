export interface TrustSignals {
  domain: string
  domainAgeDays: number
  hasMx: boolean
  hasHttps: boolean
  publicMentions: number
}

export interface TrustScore {
  score: number // 0..100
  signals: TrustSignals
  reasons: string[]
}

export function scoreTrust(signals: TrustSignals): TrustScore {
  const reasons: string[] = []
  let score = 0

  if (signals.domainAgeDays > 365 * 2) {
    score += 40
    reasons.push("domain older than 2 years")
  } else if (signals.domainAgeDays > 90) {
    score += 20
    reasons.push("domain older than 90 days")
  }

  if (signals.hasHttps) {
    score += 10
    reasons.push("https configured")
  }
  if (signals.hasMx) {
    score += 15
    reasons.push("mx records present")
  }
  score += Math.min(35, signals.publicMentions)
  if (signals.publicMentions > 0) {
    reasons.push(`${signals.publicMentions} public mention(s)`)
  }

  return {
    score: Math.min(100, score),
    signals,
    reasons,
  }
}

// TODO: real domain-age lookup via RDAP / WHOIS. Stub returns 0.
export async function getDomainAgeDays(_domain: string): Promise<number> {
  return 0
}
