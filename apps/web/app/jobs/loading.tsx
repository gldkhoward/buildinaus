import { PageShell } from "@/components/layout/page-shell"
import {
  PageHeaderSkeleton,
  ListRowsSkeleton,
} from "@/components/layout/skeletons"

export default function Loading() {
  return (
    <PageShell>
      <PageHeaderSkeleton withAction />
      <ListRowsSkeleton count={6} label="loading" />
    </PageShell>
  )
}
