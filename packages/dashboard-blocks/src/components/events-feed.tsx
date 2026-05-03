import { Card, CardContent, CardHeader, CardTitle } from "@buildinaus/ui/atoms/card"
import { CalendarDays } from "lucide-react"

export function EventsFeedBlock() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4" /> Events Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Upcoming meetups, demo days, and pitch nights.
      </CardContent>
    </Card>
  )
}
