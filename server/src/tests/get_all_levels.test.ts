import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { getAllLevels } from '../handlers/get_all_levels';

describe('getAllLevels', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no levels exist', async () => {
    const result = await getAllLevels();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return engineering level without criteria when no criteria exist', async () => {
    // Create a level without criteria
    await db.insert(engineeringLevelsTable)
      .values({
        id: 'L3',
        title: 'Senior Software Engineer',
        job_title: 'Senior Software Engineer',
        one_sentence_description: 'Experienced engineer with technical expertise',
        scope_of_influence_summary: 'Team level impact',
        ownership_summary: 'Owns feature development',
        trajectory_notes: 'Path to staff level'
      })
      .execute();

    const result = await getAllLevels();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('L3');
    expect(result[0].title).toEqual('Senior Software Engineer');
    expect(result[0].job_title).toEqual('Senior Software Engineer');
    expect(result[0].one_sentence_description).toEqual('Experienced engineer with technical expertise');
    expect(result[0].scope_of_influence_summary).toEqual('Team level impact');
    expect(result[0].ownership_summary).toEqual('Owns feature development');
    expect(result[0].trajectory_notes).toEqual('Path to staff level');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].criteria).toEqual([]);
    expect(Array.isArray(result[0].criteria)).toBe(true);
  });

  it('should return engineering level with criteria when criteria exist', async () => {
    // Create a level
    await db.insert(engineeringLevelsTable)
      .values({
        id: 'L4',
        title: 'Staff Software Engineer',
        job_title: 'Staff Software Engineer',
        one_sentence_description: 'Senior engineer with broad impact',
        scope_of_influence_summary: 'Cross-team impact',
        ownership_summary: 'Owns system design',
        trajectory_notes: 'Path to principal level'
      })
      .execute();

    // Create criteria for this level
    await db.insert(levelCriteriaTable)
      .values([
        {
          engineering_level_id: 'L4',
          category: 'Craft',
          sub_category: 'Technical Expertise',
          description: 'Deep technical knowledge in multiple domains'
        },
        {
          engineering_level_id: 'L4',
          category: 'Impact',
          sub_category: 'Planning',
          description: 'Plans work across multiple quarters'
        }
      ])
      .execute();

    const result = await getAllLevels();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('L4');
    expect(result[0].title).toEqual('Staff Software Engineer');
    expect(result[0].criteria).toHaveLength(2);
    
    // Check first criterion
    expect(result[0].criteria[0].engineering_level_id).toEqual('L4');
    expect(result[0].criteria[0].category).toEqual('Craft');
    expect(result[0].criteria[0].sub_category).toEqual('Technical Expertise');
    expect(result[0].criteria[0].description).toEqual('Deep technical knowledge in multiple domains');
    expect(result[0].criteria[0].id).toBeDefined();

    // Check second criterion
    expect(result[0].criteria[1].engineering_level_id).toEqual('L4');
    expect(result[0].criteria[1].category).toEqual('Impact');
    expect(result[0].criteria[1].sub_category).toEqual('Planning');
    expect(result[0].criteria[1].description).toEqual('Plans work across multiple quarters');
    expect(result[0].criteria[1].id).toBeDefined();
  });

  it('should return multiple levels with their respective criteria', async () => {
    // Create multiple levels
    await db.insert(engineeringLevelsTable)
      .values([
        {
          id: 'L2',
          title: 'Software Engineer II',
          job_title: 'Software Engineer',
          one_sentence_description: 'Developing engineer',
          scope_of_influence_summary: 'Individual contributor',
          ownership_summary: 'Owns tasks',
          trajectory_notes: 'Growing skills'
        },
        {
          id: 'L3',
          title: 'Senior Software Engineer',
          job_title: 'Senior Software Engineer',
          one_sentence_description: 'Experienced engineer',
          scope_of_influence_summary: 'Team contributor',
          ownership_summary: 'Owns features',
          trajectory_notes: 'Technical leadership'
        }
      ])
      .execute();

    // Create criteria for both levels
    await db.insert(levelCriteriaTable)
      .values([
        {
          engineering_level_id: 'L2',
          category: 'Craft',
          sub_category: 'Technical Expertise',
          description: 'Solid foundation in core technologies'
        },
        {
          engineering_level_id: 'L3',
          category: 'Craft',
          sub_category: 'Technical Expertise',
          description: 'Expert in core technologies'
        },
        {
          engineering_level_id: 'L3',
          category: 'Impact',
          sub_category: 'Planning',
          description: 'Plans sprints and features'
        }
      ])
      .execute();

    const result = await getAllLevels();

    expect(result).toHaveLength(2);
    
    // Results should be ordered by level ID
    const l2 = result.find(level => level.id === 'L2');
    const l3 = result.find(level => level.id === 'L3');

    expect(l2).toBeDefined();
    expect(l3).toBeDefined();

    // L2 should have 1 criterion
    expect(l2!.criteria).toHaveLength(1);
    expect(l2!.criteria[0].category).toEqual('Craft');
    expect(l2!.criteria[0].description).toEqual('Solid foundation in core technologies');

    // L3 should have 2 criteria
    expect(l3!.criteria).toHaveLength(2);
    expect(l3!.criteria.some(c => c.category === 'Craft')).toBe(true);
    expect(l3!.criteria.some(c => c.category === 'Impact')).toBe(true);
  });

  it('should handle levels with nullable fields correctly', async () => {
    // Create a level with some nullable fields set to null
    await db.insert(engineeringLevelsTable)
      .values({
        id: 'TL1',
        title: 'Tech Lead I',
        job_title: null,
        one_sentence_description: null,
        scope_of_influence_summary: 'Team leadership',
        ownership_summary: null,
        trajectory_notes: null
      })
      .execute();

    // Create criterion with null description
    await db.insert(levelCriteriaTable)
      .values({
        engineering_level_id: 'TL1',
        category: 'Growth',
        sub_category: 'Mentoring',
        description: null
      })
      .execute();

    const result = await getAllLevels();

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual('TL1');
    expect(result[0].title).toEqual('Tech Lead I');
    expect(result[0].job_title).toBeNull();
    expect(result[0].one_sentence_description).toBeNull();
    expect(result[0].scope_of_influence_summary).toEqual('Team leadership');
    expect(result[0].ownership_summary).toBeNull();
    expect(result[0].trajectory_notes).toBeNull();
    
    expect(result[0].criteria).toHaveLength(1);
    expect(result[0].criteria[0].description).toBeNull();
    expect(result[0].criteria[0].category).toEqual('Growth');
    expect(result[0].criteria[0].sub_category).toEqual('Mentoring');
  });

  it('should maintain proper ordering of results', async () => {
    // Create levels in non-alphabetical order
    await db.insert(engineeringLevelsTable)
      .values([
        {
          id: 'L5',
          title: 'Principal Engineer',
          job_title: 'Principal Engineer',
          one_sentence_description: 'Technical leader',
          scope_of_influence_summary: 'Organization wide',
          ownership_summary: 'Owns architecture',
          trajectory_notes: 'Senior technical leader'
        },
        {
          id: 'L1',
          title: 'Junior Engineer',
          job_title: 'Software Engineer',
          one_sentence_description: 'Entry level',
          scope_of_influence_summary: 'Learning',
          ownership_summary: 'Guided tasks',
          trajectory_notes: 'Building foundation'
        },
        {
          id: 'L3',
          title: 'Senior Engineer',
          job_title: 'Senior Software Engineer',
          one_sentence_description: 'Experienced',
          scope_of_influence_summary: 'Team level',
          ownership_summary: 'Owns features',
          trajectory_notes: 'Technical expertise'
        }
      ])
      .execute();

    const result = await getAllLevels();

    expect(result).toHaveLength(3);
    // Should be ordered by ID
    expect(result[0].id).toEqual('L1');
    expect(result[1].id).toEqual('L3');
    expect(result[2].id).toEqual('L5');
  });
});