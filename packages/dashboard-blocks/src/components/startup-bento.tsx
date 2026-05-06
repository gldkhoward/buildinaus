import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@buildinaus/ui/atoms/card"
import { Badge } from "@buildinaus/ui/atoms/badge"
import { Building2, Globe, MapPin, Users } from "lucide-react"

import type { StartupBentoData } from "../types"

export function StartupBento({ startup }: { startup: StartupBentoData }) {
  const website = startup.links.website
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="size-4" />
          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              {startup.name}
            </a>
          ) : (
            <span>{startup.name}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {startup.primary_problem ? (
          <p className="text-foreground">{startup.primary_problem}</p>
        ) : null}
        {startup.description ? (
          <p className="text-muted-foreground">{startup.description}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {startup.hq_location ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-3.5" />
              <span>{startup.hq_location}</span>
            </div>
          ) : null}
          {website ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="size-3.5" />
              <a href={website} className="truncate hover:underline" target="_blank" rel="noreferrer">
                {website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          ) : null}
          {startup.founders.length > 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
              <Users className="size-3.5" />
              <span>{startup.founders.join(", ")}</span>
            </div>
          ) : null}
        </div>

        {startup.industry.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {startup.industry.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
