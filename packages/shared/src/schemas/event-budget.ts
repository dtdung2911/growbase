import { z } from "zod"

export const createEventBudgetSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  total_budget: z.number().nonnegative(),
  event_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateEventBudgetSchema = createEventBudgetSchema.partial().extend({
  status: z.enum(["active", "completed"]).optional(),
  total_actual: z.number().nonnegative().optional(),
})

export const createEventBudgetItemSchema = z.object({
  event_budget_id: z.string().uuid(),
  name: z.string().min(1, "Tên không được để trống"),
  planned_amount: z.number().nonnegative(),
  actual_amount: z.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
})

export const updateEventBudgetItemSchema = createEventBudgetItemSchema.partial()

export type CreateEventBudgetInput = z.infer<typeof createEventBudgetSchema>
export type UpdateEventBudgetInput = z.infer<typeof updateEventBudgetSchema>
export type CreateEventBudgetItemInput = z.infer<typeof createEventBudgetItemSchema>
export type UpdateEventBudgetItemInput = z.infer<typeof updateEventBudgetItemSchema>
