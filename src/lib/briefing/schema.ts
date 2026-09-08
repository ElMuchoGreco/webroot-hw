import { z } from "zod";

const stringArray = () => z.array(z.string().trim().min(1)).catch([]);

export const entitiesSchema = z
  .object({
    people: stringArray(),
    organizations: stringArray(),
    locations: stringArray(),
  })
  .catch({ people: [], organizations: [], locations: [] });

export const articleBriefingSchema = z.object({
  summary: z.string().trim().min(1, "Summary must not be empty"),
  keyPoints: stringArray(),
  entities: entitiesSchema,
  topics: stringArray(),
  category: z
    .string()
    .trim()
    .min(1)
    .catch("Uncategorized"),
  checkableClaims: stringArray(),
});

export type ArticleBriefing = z.infer<typeof articleBriefingSchema>;
export type Entities = z.infer<typeof entitiesSchema>;
