import { Card, CardContent, CardHeader, CardTitle } from "@buildinaus/ui/atoms/card"
import { MapPin } from "lucide-react"

export function VcMapBlock() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="size-4" /> VC Map
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Active funds across Sydney, Melbourne, Brisbane and beyond.
      </CardContent>
    </Card>
  )
}
