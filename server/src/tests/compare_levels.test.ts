import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type ComparisonInput } from '../schema';
import { compareLevels } from '../handlers/compare_levels';

// Test data setup
const testLevels = [
  {
    id: 'L3',
    title: 'Software Engineer III',
    job_title: 'Senior Software Engineer',
    one_sentence_description: 'An experienced individual contributor',
    scope_of_influence_summary: 'Team level impact',
    ownership_summary: 'Owns features end-to-end',
    trajectory_notes: 'Growth towards technical leadership'
  },
  {
    id: 'L4',
    title: 'Software Engineer IV',
    job_title: 'Staff Software Engineer',
    one_sentence_description: 'A senior technical leader',
    scope_of_influence_summary: 'Multi-team impact',
    ownership_summary: 'Owns complex systems',
    trajectory_notes: 'Technical leadership track'
  },
  {
    id: 'TL1',
    title: 'Tech Lead I',
    job_title: 'Tech Lead',
    one_sentence_description: 'Technical team leader',
    scope_of_influence_summary: 'Single team technical direction',
    ownership_summary: 'Owns team technical decisions',
    trajectory_notes: 'Management or senior IC track'
  }
];

const testCriteria = [
  {
    engineering_level_id: 'L3',
    category: 'Craft',
    sub_category: 'Technical Expertise',
    description: 'Expert in primary technology stack'
  },
  {
    engineering_level_id: 'L3',
    category: 'Impact',
    sub_category: 'Planning',
    description: 'Plans and executes medium complexity projects'
  },
  {
    engineering_level_id: 'L4',
    category: 'Craft',
    sub_category: 'Technical Expertise',
    description: 'Deep expertise across multiple domains'
  },
  {
    engineering_level_id: 'L4',
    category: 'Impact',
    sub_category: 'Planning',
    description: 'Plans and leads complex cross-team initiatives'
  },
  {
    engineering_level_id: 'TL1',
    category: 'Craft',
    sub_category: 'Technical Leadership',
    description: 'Provides technical direction for team'
  }
];

describe('compareLevels', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Insert test engineering levels
    await db.insert(engineeringLevelsTable)
      .values(testLevels)
      .execute();

    // Insert test criteria
    await db.insert(levelCriteriaTable)
      .values(testCriteria)
      .execute();
  });

  it('should compare two levels with their criteria', async () => {
    const input: ComparisonInput = {
      level_ids: ['L3', 'L4']
    };

    const result = await compareLevels(input);

    expect(result).toHaveLength(2);
    
    // Check L3 level
    const l3Level = result[0];
    expect(l3Level.id).toEqual('L3');
    expect(l3Level.title).toEqual('Software Engineer III');
    expect(l3Level.job_title).toEqual('Senior Software Engineer');
    expect(l3Level.criteria).toHaveLength(2);
    expect(l3Level.criteria[0].category).toEqual('Craft');
    expect(l3Level.criteria[1].category).toEqual('Impact');
    expect(l3Level.created_at).toBeInstanceOf(Date);

    // Check L4 level
    const l4Level = result[1];
    expect(l4Level.id).toEqual('L4');
    expect(l4Level.title).toEqual('Software Engineer IV');
    expect(l4Level.criteria).toHaveLength(2);
  });

  it('should return levels in requested order', async () => {
    const input: ComparisonInput = {
      level_ids: ['TL1', 'L3', 'L4']
    };

    const result = await compareLevels(input);

    expect(result).toHaveLength(3);
    expect(result[0].id).toEqual('TL1');
    expect(result[1].id).toEqual('L3');
    expect(result[2].id).toEqual('L4');
  });

  it('should handle maximum comparison of 4 levels', async () => {
    // Add one more level for testing max limit
    await db.insert(engineeringLevelsTable)
      .values({
        id: 'EM1',
        title: 'Engineering Manager I',
        job_title: 'Engineering Manager',
        one_sentence_description: 'First-line manager',
        scope_of_influence_summary: 'Team management',
        ownership_summary: 'Owns team delivery',
        trajectory_notes: 'Management track'
      })
      .execute();

    const input: ComparisonInput = {
      level_ids: ['L3', 'L4', 'TL1', 'EM1']
    };

    const result = await compareLevels(input);

    expect(result).toHaveLength(4);
    expect(result.map(l => l.id)).toEqual(['L3', 'L4', 'TL1', 'EM1']);
  });

  it('should handle levels without criteria', async () => {
    // Add a level with no criteria
    await db.insert(engineeringLevelsTable)
      .values({
        id: 'L1',
        title: 'Software Engineer I',
        job_title: 'Junior Software Engineer',
        one_sentence_description: 'Entry level engineer',
        scope_of_influence_summary: 'Individual tasks',
        ownership_summary: 'Owns small features',
        trajectory_notes: 'Learning and growth'
      })
      .execute();

    const input: ComparisonInput = {
      level_ids: ['L1', 'L3']
    };

    const result = await compareLevels(input);

    expect(result).toHaveLength(2);
    
    // L1 should have empty criteria array
    const l1Level = result[0];
    expect(l1Level.id).toEqual('L1');
    expect(l1Level.criteria).toHaveLength(0);
    
    // L3 should have criteria
    const l3Level = result[1];
    expect(l3Level.id).toEqual('L3');
    expect(l3Level.criteria).toHaveLength(2);
  });

  it('should return empty array for non-existent level IDs', async () => {
    const input: ComparisonInput = {
      level_ids: ['NON_EXISTENT1', 'NON_EXISTENT2']
    };

    const result = await compareLevels(input);

    expect(result).toHaveLength(0);
  });

  it('should handle partial matches (some valid, some invalid IDs)', async () => {
    const input: ComparisonInput = {
      level_ids: ['L3', 'NON_EXISTENT', 'L4']
    };

    const result = await compareLevels(input);

    // Should return only the valid levels in requested order
    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual('L3');
    expect(result[1].id).toEqual('L4');
  });

  it('should handle duplicate level IDs gracefully', async () => {
    const input: ComparisonInput = {
      level_ids: ['L3', 'L3', 'L4']
    };

    const result = await compareLevels(input);

    // Should return each level only once, in order of first appearance
    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual('L3');
    expect(result[1].id).toEqual('L4');
  });

  it('should include all criterion fields correctly', async () => {
    const input: ComparisonInput = {
      level_ids: ['L3']
    };

    const result = await compareLevels(input);

    expect(result).toHaveLength(1);
    const level = result[0];
    const criterion = level.criteria[0];
    
    expect(criterion.id).toBeDefined();
    expect(criterion.engineering_level_id).toEqual('L3');
    expect(criterion.category).toEqual('Craft');
    expect(criterion.sub_category).toEqual('Technical Expertise');
    expect(criterion.description).toEqual('Expert in primary technology stack');
  });
});