import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type FilterInput, type EngineeringLevelWithCriteria } from '../schema';
import { eq, and, inArray, type SQL } from 'drizzle-orm';

export async function getFilteredLevels(input: FilterInput): Promise<EngineeringLevelWithCriteria[]> {
  try {
    // Always get all levels first, then filter criteria in post-processing
    // This ensures we return all levels even when filters match no criteria
    const query = db.select()
      .from(engineeringLevelsTable)
      .leftJoin(levelCriteriaTable, eq(engineeringLevelsTable.id, levelCriteriaTable.engineering_level_id));

    const results = await query.execute();

    // Group results by engineering level and build the response structure
    const levelMap = new Map<string, EngineeringLevelWithCriteria>();
    
    // Determine if we have filters
    const hasFilters = (input.categories && input.categories.length > 0) || 
                      (input.sub_categories && input.sub_categories.length > 0);

    for (const result of results) {
      const level = result.engineering_levels;
      const criterion = result.level_criteria;

      if (!levelMap.has(level.id)) {
        levelMap.set(level.id, {
          id: level.id,
          title: level.title,
          job_title: level.job_title,
          one_sentence_description: level.one_sentence_description,
          scope_of_influence_summary: level.scope_of_influence_summary,
          ownership_summary: level.ownership_summary,
          trajectory_notes: level.trajectory_notes,
          created_at: level.created_at,
          criteria: []
        });
      }

      // Add criterion if it exists and matches filters (or no filters applied)
      if (criterion && criterion.id) {
        // Only include criteria that match the filters
        const shouldIncludeCriterion = !hasFilters || (
          (!input.categories || input.categories.includes(criterion.category)) &&
          (!input.sub_categories || input.sub_categories.includes(criterion.sub_category))
        );

        if (shouldIncludeCriterion) {
          levelMap.get(level.id)!.criteria.push({
            id: criterion.id,
            engineering_level_id: criterion.engineering_level_id,
            category: criterion.category,
            sub_category: criterion.sub_category,
            description: criterion.description
          });
        }
      }
    }

    // Convert map to array and sort by level id for consistent ordering
    return Array.from(levelMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    console.error('Filter levels operation failed:', error);
    throw error;
  }
}