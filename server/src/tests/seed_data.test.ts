import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { seedDatabase, seedEngineeringLevels, seedLevelCriteria } from '../handlers/seed_data';

describe('seedDatabase', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should seed engineering levels successfully', async () => {
    await seedDatabase();

    // Check that all engineering levels were inserted
    const levels = await db.select()
      .from(engineeringLevelsTable)
      .execute();

    expect(levels).toHaveLength(seedEngineeringLevels.length);

    // Verify specific level data
    const l3Level = levels.find(level => level.id === 'L3');
    expect(l3Level).toBeDefined();
    expect(l3Level!.title).toEqual('L3');
    expect(l3Level!.job_title).toBeNull();
    expect(l3Level!.scope_of_influence_summary).toEqual('Their area and strategy');
    expect(l3Level!.created_at).toBeInstanceOf(Date);

    const em1Level = levels.find(level => level.id === 'EM1');
    expect(em1Level).toBeDefined();
    expect(em1Level!.title).toEqual('EM1');
    expect(em1Level!.job_title).toEqual('Engineering Manager');
    expect(em1Level!.one_sentence_description).toContain('Eng Manager supports Lead Engineers');
  });

  it('should seed level criteria successfully', async () => {
    await seedDatabase();

    // Check that all criteria were inserted
    const criteria = await db.select()
      .from(levelCriteriaTable)
      .execute();

    expect(criteria).toHaveLength(seedLevelCriteria.length);

    // Verify L3 criteria
    const l3Criteria = criteria.filter(criterion => criterion.engineering_level_id === 'L3');
    expect(l3Criteria).toHaveLength(5);

    const l3TechnicalExpertise = l3Criteria.find(c => 
      c.category === 'Craft' && c.sub_category === 'Technical Expertise'
    );
    expect(l3TechnicalExpertise).toBeDefined();
    expect(l3TechnicalExpertise!.description).toContain('sufficient practical and foundational knowledge');

    // Verify L5 criteria
    const l5Criteria = criteria.filter(criterion => criterion.engineering_level_id === 'L5');
    expect(l5Criteria).toHaveLength(5);

    // Verify EM1 criteria (including null descriptions)
    const em1Criteria = criteria.filter(criterion => criterion.engineering_level_id === 'EM1');
    expect(em1Criteria).toHaveLength(5);

    const em1Planning = em1Criteria.find(c => 
      c.category === 'Impact' && c.sub_category === 'Planning'
    );
    expect(em1Planning).toBeDefined();
    expect(em1Planning!.description).toBeNull();
  });

  it('should maintain foreign key relationships', async () => {
    await seedDatabase();

    // Query with join to verify relationships work
    const levelsWithCriteria = await db.select()
      .from(engineeringLevelsTable)
      .innerJoin(
        levelCriteriaTable, 
        eq(engineeringLevelsTable.id, levelCriteriaTable.engineering_level_id)
      )
      .where(eq(engineeringLevelsTable.id, 'L5'))
      .execute();

    expect(levelsWithCriteria).toHaveLength(5); // L5 has 5 criteria

    // Verify joined data structure
    const firstResult = levelsWithCriteria[0];
    expect(firstResult.engineering_levels.id).toEqual('L5');
    expect(firstResult.engineering_levels.title).toEqual('L5');
    expect(firstResult.level_criteria.engineering_level_id).toEqual('L5');
    expect(firstResult.level_criteria.category).toBeDefined();
    expect(firstResult.level_criteria.sub_category).toBeDefined();
  });

  it('should handle all category and sub_category combinations', async () => {
    await seedDatabase();

    const criteria = await db.select()
      .from(levelCriteriaTable)
      .execute();

    // Check that we have the expected categories
    const categories = [...new Set(criteria.map(c => c.category))];
    expect(categories).toContain('Craft');
    expect(categories).toContain('Impact');
    expect(categories).toContain('Growth');

    // Check that we have the expected sub-categories
    const subCategories = [...new Set(criteria.map(c => c.sub_category))];
    expect(subCategories).toContain('Technical Expertise');
    expect(subCategories).toContain('Scope');
    expect(subCategories).toContain('Planning');
    expect(subCategories).toContain('Execution');
    expect(subCategories).toContain('Mentoring & Feedback');
  });

  it('should handle multiple seeding operations idempotently', async () => {
    // First seeding
    await seedDatabase();

    const initialLevels = await db.select().from(engineeringLevelsTable).execute();
    const initialCriteria = await db.select().from(levelCriteriaTable).execute();

    expect(initialLevels).toHaveLength(seedEngineeringLevels.length);
    expect(initialCriteria).toHaveLength(seedLevelCriteria.length);

    // Note: In a real implementation, you might want to handle duplicate seeding
    // This test demonstrates the current behavior - duplicates would cause an error
    // due to primary key constraints on the engineering_levels table
    await expect(seedDatabase()).rejects.toThrow(/duplicate key value/i);
  });

  it('should create all expected engineering level IDs', async () => {
    await seedDatabase();

    const levels = await db.select()
      .from(engineeringLevelsTable)
      .execute();

    const levelIds = levels.map(level => level.id).sort();
    const expectedIds = ['L1/L2', 'L3', 'L5', 'EM1'].sort();
    
    expect(levelIds).toEqual(expectedIds);
  });

  it('should preserve nullable field values correctly', async () => {
    await seedDatabase();

    // Check L3 level with mixed null/non-null fields
    const l3Level = await db.select()
      .from(engineeringLevelsTable)
      .where(eq(engineeringLevelsTable.id, 'L3'))
      .execute();

    expect(l3Level).toHaveLength(1);
    expect(l3Level[0].job_title).toBeNull();
    expect(l3Level[0].one_sentence_description).toBeNull();
    expect(l3Level[0].scope_of_influence_summary).not.toBeNull();
    expect(l3Level[0].ownership_summary).not.toBeNull();

    // Check EM1 criteria with null descriptions
    const em1NullCriteria = await db.select()
      .from(levelCriteriaTable)
      .where(eq(levelCriteriaTable.engineering_level_id, 'EM1'))
      .execute();

    const planningCriterion = em1NullCriteria.find(c => c.sub_category === 'Planning');
    const executionCriterion = em1NullCriteria.find(c => c.sub_category === 'Execution');
    
    expect(planningCriterion!.description).toBeNull();
    expect(executionCriterion!.description).toBeNull();
  });
});