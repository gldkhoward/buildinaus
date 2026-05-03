import { Card, CardContent, CardHeader, CardTitle } from "@buildinaus/ui/atoms/card"
import { Briefcase } from "lucide-react"

export function JobsBoardBlock() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="size-4" /> Jobs Board
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Open roles at portfolio companies near you.
      </CardContent>
    </Card>
  )
}
