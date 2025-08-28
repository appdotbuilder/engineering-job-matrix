import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type JobMatrixOverview } from '../schema';
import { sql } from 'drizzle-orm';

export async function getMatrixOverview(): Promise<JobMatrixOverview> {
  try {
    // Get all unique categories and sub_categories
    const categoriesResult = await db
      .selectDistinct({
        category: levelCriteriaTable.category,
        sub_category: levelCriteriaTable.sub_category
      })
      .from(levelCriteriaTable)
      .orderBy(levelCriteriaTable.category, levelCriteriaTable.sub_category)
      .execute();

    // Get all level IDs
    const levelsResult = await db
      .select({ id: engineeringLevelsTable.id })
      .from(engineeringLevelsTable)
      .orderBy(engineeringLevelsTable.id)
      .execute();

    // Process categories and sub_categories
    const categories: string[] = [];
    const sub_categories: Record<string, string[]> = {};

    categoriesResult.forEach(({ category, sub_category }) => {
      if (!categories.includes(category)) {
        categories.push(category);
      }
      
      if (!sub_categories[category]) {
        sub_categories[category] = [];
      }
      
      if (!sub_categories[category].includes(sub_category)) {
        sub_categories[category].push(sub_category);
      }
    });

    // Extract level IDs
    const level_ids = levelsResult.map(level => level.id);

    // Create level groups based on the requirements
    const level_groups: Record<string, string[]> = {
      IC: [],
      TL: [],
      EM: []
    };

    level_ids.forEach(levelId => {
      if (levelId.startsWith('L') || levelId.includes('L1/L2')) {
        level_groups['IC'].push(levelId);
      } else if (levelId.startsWith('TL')) {
        level_groups['TL'].push(levelId);
      } else if (levelId.startsWith('EM')) {
        level_groups['EM'].push(levelId);
      }
    });

    return {
      categories,
      sub_categories,
      level_ids,
      level_groups
    };
  } catch (error) {
    console.error('Failed to get matrix overview:', error);
    throw error;
  }
}