import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@buildinaus/ui/atoms/card"
import { Briefcase, Globe, MapPin, User } from "lucide-react"

import type { FounderCardData } from "../types"

export function FounderCard({ founder }: { founder: FounderCardData }) {
  const website = founder.links.website ?? founder.links.linkedin
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="size-4" />
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {founder.name}
            </a>
          ) : (
            <span>{founder.name}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {founder.headline ? (
          <p className="text-foreground">{founder.headline}</p>
        ) : null}
        {founder.bio ? (
          <p className="text-muted-foreground">{founder.bio}</p>
        ) : null}
        <div className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-2">
          {founder.current_company ? (
            <div className="flex items-center gap-2">
              <Briefcase className="size-3.5" />
              <span>{founder.current_company}</span>
            </div>
          ) : null}
          {founder.city ? (
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5" />
              <span>{founder.city}</span>
            </div>
          ) : null}
          {founder.links.linkedin ? (
            <div className="flex items-center gap-2 sm:col-span-2">
              <Globe className="size-3.5" />
              <a
                href={founder.links.linkedin}
                target="_blank"
                rel="noreferrer"
                className="truncate hover:underline"
              >
                {founder.links.linkedin.replace(/^https?:\/\//, "")}
              </a>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
