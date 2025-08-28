import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type ComparisonInput, type EngineeringLevelWithCriteria } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export async function compareLevels(input: ComparisonInput): Promise<EngineeringLevelWithCriteria[]> {
  try {
    // Fetch engineering levels with their criteria in a single query
    const results = await db.select()
      .from(engineeringLevelsTable)
      .leftJoin(
        levelCriteriaTable,
        eq(engineeringLevelsTable.id, levelCriteriaTable.engineering_level_id)
      )
      .where(inArray(engineeringLevelsTable.id, input.level_ids))
      .execute();

    // Group results by engineering level to handle the joined data structure
    const levelMap = new Map<string, EngineeringLevelWithCriteria>();

    for (const result of results) {
      const level = result.engineering_levels;
      const criterion = result.level_criteria;

      if (!levelMap.has(level.id)) {
        levelMap.set(level.id, {
          ...level,
          criteria: []
        });
      }

      // Add criterion if it exists (leftJoin can return null criteria)
      if (criterion) {
        levelMap.get(level.id)!.criteria.push(criterion);
      }
    }

    // Return levels in the same order as requested in input, avoiding duplicates
    const orderedLevels: EngineeringLevelWithCriteria[] = [];
    const addedLevelIds = new Set<string>();
    
    for (const levelId of input.level_ids) {
      const level = levelMap.get(levelId);
      if (level && !addedLevelIds.has(levelId)) {
        orderedLevels.push(level);
        addedLevelIds.add(levelId);
      }
    }

    return orderedLevels;
  } catch (error) {
    console.error('Compare levels failed:', error);
    throw error;
  }
}