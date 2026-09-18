import { z } from "zod";
import {
  requirementReadinessCheckSchema,
  requirementReadinessStatusSchema,
  requirementStatusSchema,
} from "./requirements.js";

export const readinessPortfolioItemSchema = z.object({
  requirementId: z.uuid(),
  title: z.string().min(1),
  lifecycleStatus: requirementStatusSchema,
  version: z.number().int().positive(),
  readinessStatus: requirementReadinessStatusSchema,
  failedChecks: z.array(requirementReadinessCheckSchema),
});
export const readinessPortfolioSchema = z.object({
  total: z.number().int().nonnegative(),
  ready: z.number().int().nonnegative(),
  conditional: z.number().int().nonnegative(),
  notReady: z.number().int().nonnegative(),
  items: z.array(readinessPortfolioItemSchema),
});
export type ReadinessPortfolio = z.infer<typeof readinessPortfolioSchema>;
