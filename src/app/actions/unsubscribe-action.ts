"use server"

import { z } from "zod"
import { actionClient } from "@/lib/safe-action"
import { deleteContactByEmail } from "@/lib/usesend"
import type { ActionResponse } from "@/types/actions"

const unsubscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const unsubscribeAction = actionClient
  .schema(unsubscribeSchema)
  .action(async ({ parsedInput: { email } }): Promise<ActionResponse> => {
    try {
      await deleteContactByEmail(email)

      return {
        success: true,
        data: { message: "Successfully unsubscribed" },
      }
    } catch (error) {
      console.error("Unsubscribe action error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to unsubscribe",
      }
    }
  })

