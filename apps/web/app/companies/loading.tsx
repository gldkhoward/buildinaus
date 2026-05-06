import { PageShell } from "@/components/layout/page-shell"
import {
  PageHeaderSkeleton,
  CardGridSkeleton,
} from "@/components/layout/skeletons"

export default function Loading() {
  return (
    <PageShell>
      <PageHeaderSkeleton withAction />
      <CardGridSkeleton count={6} />
    </PageShell>
  )
}
