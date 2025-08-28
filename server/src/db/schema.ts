import { text, pgTable, timestamp, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const engineeringLevelsTable = pgTable('engineering_levels', {
  id: text('id').primaryKey(), // e.g., "L3", "TL1", "EM2", "L1/L2"
  title: text('title').notNull(),
  job_title: text('job_title'), // Nullable - corresponding common job title
  one_sentence_description: text('one_sentence_description'), // Nullable - brief summary
  scope_of_influence_summary: text('scope_of_influence_summary'), // Nullable - from Levels sheet
  ownership_summary: text('ownership_summary'), // Nullable - from Levels sheet
  trajectory_notes: text('trajectory_notes'), // Nullable - from Engineering sheet Row 24
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const levelCriteriaTable = pgTable('level_criteria', {
  id: serial('id').primaryKey(),
  engineering_level_id: text('engineering_level_id').references(() => engineeringLevelsTable.id).notNull(),
  category: text('category').notNull(), // e.g., "Craft", "Impact", "Growth"
  sub_category: text('sub_category').notNull(), // e.g., "Technical Expertise", "Planning"
  description: text('description') // Nullable - can be null if not defined for this level
});

// Relations
export const engineeringLevelsRelations = relations(engineeringLevelsTable, ({ many }) => ({
  criteria: many(levelCriteriaTable)
}));

export const levelCriteriaRelations = relations(levelCriteriaTable, ({ one }) => ({
  engineeringLevel: one(engineeringLevelsTable, {
    fields: [levelCriteriaTable.engineering_level_id],
    references: [engineeringLevelsTable.id]
  })
}));

// TypeScript types for the table schemas
export type EngineeringLevel = typeof engineeringLevelsTable.$inferSelect;
export type NewEngineeringLevel = typeof engineeringLevelsTable.$inferInsert;
export type LevelCriterion = typeof levelCriteriaTable.$inferSelect;
export type NewLevelCriterion = typeof levelCriteriaTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  engineeringLevels: engineeringLevelsTable,
  levelCriteria: levelCriteriaTable
};