import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type CreateLevelCriterionInput } from '../schema';
import { createLevelCriterion } from '../handlers/create_level_criterion';
import { eq } from 'drizzle-orm';

// Test engineering level to satisfy foreign key constraint
const testEngineeringLevel = {
  id: 'L3',
  title: 'Senior Software Engineer',
  job_title: 'Senior Software Engineer',
  one_sentence_description: 'An experienced engineer who delivers complex features independently',
  scope_of_influence_summary: 'Team level impact',
  ownership_summary: 'Owns feature development',
  trajectory_notes: 'Path to staff level'
};

// Test input for level criterion
const testInput: CreateLevelCriterionInput = {
  engineering_level_id: 'L3',
  category: 'Craft',
  sub_category: 'Technical Expertise',
  description: 'Demonstrates deep knowledge in their domain and related technologies'
};

describe('createLevelCriterion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a level criterion successfully', async () => {
    // Create prerequisite engineering level
    await db.insert(engineeringLevelsTable)
      .values(testEngineeringLevel)
      .execute();

    const result = await createLevelCriterion(testInput);

    // Verify returned data
    expect(result.engineering_level_id).toEqual('L3');
    expect(result.category).toEqual('Craft');
    expect(result.sub_category).toEqual('Technical Expertise');
    expect(result.description).toEqual('Demonstrates deep knowledge in their domain and related technologies');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
  });

  it('should save level criterion to database', async () => {
    // Create prerequisite engineering level
    await db.insert(engineeringLevelsTable)
      .values(testEngineeringLevel)
      .execute();

    const result = await createLevelCriterion(testInput);

    // Query database to verify persistence
    const criteria = await db.select()
      .from(levelCriteriaTable)
      .where(eq(levelCriteriaTable.id, result.id))
      .execute();

    expect(criteria).toHaveLength(1);
    expect(criteria[0].engineering_level_id).toEqual('L3');
    expect(criteria[0].category).toEqual('Craft');
    expect(criteria[0].sub_category).toEqual('Technical Expertise');
    expect(criteria[0].description).toEqual('Demonstrates deep knowledge in their domain and related technologies');
  });

  it('should create level criterion with null description', async () => {
    // Create prerequisite engineering level
    await db.insert(engineeringLevelsTable)
      .values(testEngineeringLevel)
      .execute();

    const inputWithNullDescription: CreateLevelCriterionInput = {
      ...testInput,
      description: null
    };

    const result = await createLevelCriterion(inputWithNullDescription);

    expect(result.description).toBeNull();

    // Verify in database
    const criteria = await db.select()
      .from(levelCriteriaTable)
      .where(eq(levelCriteriaTable.id, result.id))
      .execute();

    expect(criteria[0].description).toBeNull();
  });

  it('should throw error when engineering level does not exist', async () => {
    const inputWithInvalidLevel: CreateLevelCriterionInput = {
      ...testInput,
      engineering_level_id: 'INVALID_LEVEL'
    };

    await expect(createLevelCriterion(inputWithInvalidLevel))
      .rejects
      .toThrow(/Engineering level with id 'INVALID_LEVEL' does not exist/i);
  });

  it('should create multiple criteria for the same engineering level', async () => {
    // Create prerequisite engineering level
    await db.insert(engineeringLevelsTable)
      .values(testEngineeringLevel)
      .execute();

    // Create first criterion
    const firstCriterion = await createLevelCriterion(testInput);

    // Create second criterion with different category/sub_category
    const secondInput: CreateLevelCriterionInput = {
      engineering_level_id: 'L3',
      category: 'Impact',
      sub_category: 'Planning',
      description: 'Plans and executes complex projects with minimal guidance'
    };

    const secondCriterion = await createLevelCriterion(secondInput);

    // Verify both criteria exist for the same level
    const allCriteria = await db.select()
      .from(levelCriteriaTable)
      .where(eq(levelCriteriaTable.engineering_level_id, 'L3'))
      .execute();

    expect(allCriteria).toHaveLength(2);
    expect(allCriteria.find(c => c.id === firstCriterion.id)).toBeDefined();
    expect(allCriteria.find(c => c.id === secondCriterion.id)).toBeDefined();
  });

  it('should handle different categories and sub_categories correctly', async () => {
    // Create prerequisite engineering level
    await db.insert(engineeringLevelsTable)
      .values(testEngineeringLevel)
      .execute();

    const growthInput: CreateLevelCriterionInput = {
      engineering_level_id: 'L3',
      category: 'Growth',
      sub_category: 'Mentoring',
      description: 'Mentors junior engineers and shares knowledge actively'
    };

    const result = await createLevelCriterion(growthInput);

    expect(result.category).toEqual('Growth');
    expect(result.sub_category).toEqual('Mentoring');
    expect(result.description).toEqual('Mentors junior engineers and shares knowledge actively');
  });
});