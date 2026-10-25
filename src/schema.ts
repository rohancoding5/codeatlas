import { z } from "zod";

export const MapNarrativeSchema = z.object({
  summary: z.string().min(1),
  notableConcerns: z.array(z.string()),
});
