import { z } from 'zod';

// Level criterion schema
export const levelCriterionSchema = z.object({
  id: z.number(),
  engineering_level_id: z.string(),
  category: z.string(),
  sub_category: z.string(),
  description: z.string().nullable()
});

export type LevelCriterion = z.infer<typeof levelCriterionSchema>;

// Engineering level schema
export const engineeringLevelSchema = z.object({
  id: z.string(),
  title: z.string(),
  job_title: z.string().nullable(),
  one_sentence_description: z.string().nullable(),
  scope_of_influence_summary: z.string().nullable(),
  ownership_summary: z.string().nullable(),
  trajectory_notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type EngineeringLevel = z.infer<typeof engineeringLevelSchema>;

// Engineering level with criteria (for joined queries)
export const engineeringLevelWithCriteriaSchema = z.object({
  id: z.string(),
  title: z.string(),
  job_title: z.string().nullable(),
  one_sentence_description: z.string().nullable(),
  scope_of_influence_summary: z.string().nullable(),
  ownership_summary: z.string().nullable(),
  trajectory_notes: z.string().nullable(),
  created_at: z.coerce.date(),
  criteria: z.array(levelCriterionSchema)
});

export type EngineeringLevelWithCriteria = z.infer<typeof engineeringLevelWithCriteriaSchema>;

// Job matrix overview schema
export const jobMatrixOverviewSchema = z.object({
  categories: z.array(z.string()),
  sub_categories: z.record(z.string(), z.array(z.string())),
  level_ids: z.array(z.string()),
  level_groups: z.record(z.string(), z.array(z.string()))
});

export type JobMatrixOverview = z.infer<typeof jobMatrixOverviewSchema>;

// Input schemas for creating engineering levels
export const createEngineeringLevelInputSchema = z.object({
  id: z.string(),
  title: z.string(),
  job_title: z.string().nullable(),
  one_sentence_description: z.string().nullable(),
  scope_of_influence_summary: z.string().nullable(),
  ownership_summary: z.string().nullable(),
  trajectory_notes: z.string().nullable()
});

export type CreateEngineeringLevelInput = z.infer<typeof createEngineeringLevelInputSchema>;

// Input schemas for creating level criteria
export const createLevelCriterionInputSchema = z.object({
  engineering_level_id: z.string(),
  category: z.string(),
  sub_category: z.string(),
  description: z.string().nullable()
});

export type CreateLevelCriterionInput = z.infer<typeof createLevelCriterionInputSchema>;

// Input schemas for updating engineering levels
export const updateEngineeringLevelInputSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  job_title: z.string().nullable().optional(),
  one_sentence_description: z.string().nullable().optional(),
  scope_of_influence_summary: z.string().nullable().optional(),
  ownership_summary: z.string().nullable().optional(),
  trajectory_notes: z.string().nullable().optional()
});

export type UpdateEngineeringLevelInput = z.infer<typeof updateEngineeringLevelInputSchema>;

// Search input schema
export const searchInputSchema = z.object({
  query: z.string().min(1)
});

export type SearchInput = z.infer<typeof searchInputSchema>;

// Filter input schema
export const filterInputSchema = z.object({
  categories: z.array(z.string()).optional(),
  sub_categories: z.array(z.string()).optional()
});

export type FilterInput = z.infer<typeof filterInputSchema>;

// Comparison input schema
export const comparisonInputSchema = z.object({
  level_ids: z.array(z.string()).min(2).max(4)
});

export type ComparisonInput = z.infer<typeof comparisonInputSchema>;

// Search result schema
export const searchResultSchema = z.object({
  level_id: z.string(),
  level_title: z.string(),
  category: z.string(),
  sub_category: z.string(),
  description: z.string(),
  match_snippet: z.string()
});

export type SearchResult = z.infer<typeof searchResultSchema>;