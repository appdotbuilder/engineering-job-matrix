import { db } from '../db';
import { engineeringLevelsTable } from '../db/schema';
import { type CreateEngineeringLevelInput, type EngineeringLevel } from '../schema';
import { eq } from 'drizzle-orm';

export async function createEngineeringLevel(input: CreateEngineeringLevelInput): Promise<EngineeringLevel> {
  try {
    // Check if level ID already exists to ensure uniqueness
    const existingLevel = await db.select()
      .from(engineeringLevelsTable)
      .where(eq(engineeringLevelsTable.id, input.id))
      .execute();

    if (existingLevel.length > 0) {
      throw new Error(`Engineering level with ID '${input.id}' already exists`);
    }

    // Insert the new engineering level
    const result = await db.insert(engineeringLevelsTable)
      .values({
        id: input.id,
        title: input.title,
        job_title: input.job_title,
        one_sentence_description: input.one_sentence_description,
        scope_of_influence_summary: input.scope_of_influence_summary,
        ownership_summary: input.ownership_summary,
        trajectory_notes: input.trajectory_notes
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Engineering level creation failed:', error);
    throw error;
  }
}