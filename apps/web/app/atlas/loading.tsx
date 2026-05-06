import { PageShell } from "@/components/layout/page-shell"
import {
  PageHeaderSkeleton,
  CardGridSkeleton,
} from "@/components/layout/skeletons"

export default function Loading() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <CardGridSkeleton count={3} cols={3} />
    </PageShell>
  )
}
