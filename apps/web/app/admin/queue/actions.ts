"use server"

import { revalidatePath } from "next/cache"
import { promote, reject } from "@/lib/data/promote"
import { requireAdmin } from "@/lib/auth/admin"

export async function promotePayload(payloadId: number) {
  await requireAdmin()
  const result = await promote(payloadId)
  revalidatePath("/admin/queue")
  return result
}

export async function rejectPayload(payloadId: number) {
  await requireAdmin()
  const result = await reject(payloadId)
  revalidatePath("/admin/queue")
  return result
}
