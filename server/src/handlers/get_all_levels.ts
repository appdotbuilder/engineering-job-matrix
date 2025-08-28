import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type EngineeringLevelWithCriteria } from '../schema';
import { eq } from 'drizzle-orm';

export async function getAllLevels(): Promise<EngineeringLevelWithCriteria[]> {
  try {
    // First, get all engineering levels
    const levels = await db.select()
      .from(engineeringLevelsTable)
      .orderBy(engineeringLevelsTable.id)
      .execute();

    // Then, get all criteria for these levels
    const criteria = await db.select()
      .from(levelCriteriaTable)
      .orderBy(levelCriteriaTable.category, levelCriteriaTable.sub_category)
      .execute();

    // Group criteria by engineering_level_id
    const criteriaByLevel = criteria.reduce((acc, criterion) => {
      const levelId = criterion.engineering_level_id;
      if (!acc[levelId]) {
        acc[levelId] = [];
      }
      acc[levelId].push(criterion);
      return acc;
    }, {} as Record<string, typeof criteria>);

    // Combine levels with their criteria
    return levels.map(level => ({
      ...level,
      criteria: criteriaByLevel[level.id] || []
    }));
  } catch (error) {
    console.error('Failed to get all levels:', error);
    throw error;
  }
}