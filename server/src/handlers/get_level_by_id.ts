import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type EngineeringLevelWithCriteria } from '../schema';
import { eq } from 'drizzle-orm';

export async function getLevelById(levelId: string): Promise<EngineeringLevelWithCriteria | null> {
  try {
    // Query engineering level with its criteria using a join
    const results = await db.select()
      .from(engineeringLevelsTable)
      .leftJoin(levelCriteriaTable, eq(levelCriteriaTable.engineering_level_id, engineeringLevelsTable.id))
      .where(eq(engineeringLevelsTable.id, levelId))
      .execute();

    // If no results found, return null
    if (results.length === 0) {
      return null;
    }

    // Group criteria by level (should only be one level, but handle gracefully)
    const levelData = results[0].engineering_levels;
    const criteria = results
      .filter(result => result.level_criteria !== null)
      .map(result => result.level_criteria!);

    return {
      ...levelData,
      criteria: criteria
    };
  } catch (error) {
    console.error('Get level by ID failed:', error);
    throw error;
  }
}