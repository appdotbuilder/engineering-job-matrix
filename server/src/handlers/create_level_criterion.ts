import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type CreateLevelCriterionInput, type LevelCriterion } from '../schema';
import { eq } from 'drizzle-orm';

export async function createLevelCriterion(input: CreateLevelCriterionInput): Promise<LevelCriterion> {
  try {
    // Validate that the engineering level exists
    const existingLevel = await db.select()
      .from(engineeringLevelsTable)
      .where(eq(engineeringLevelsTable.id, input.engineering_level_id))
      .execute();

    if (existingLevel.length === 0) {
      throw new Error(`Engineering level with id '${input.engineering_level_id}' does not exist`);
    }

    // Insert the level criterion
    const result = await db.insert(levelCriteriaTable)
      .values({
        engineering_level_id: input.engineering_level_id,
        category: input.category,
        sub_category: input.sub_category,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Level criterion creation failed:', error);
    throw error;
  }
}