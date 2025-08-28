import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { getLevelById } from '../handlers/get_level_by_id';

describe('getLevelById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return level with criteria when level exists', async () => {
    // Create test engineering level
    await db.insert(engineeringLevelsTable)
      .values({
        id: 'L3',
        title: 'Senior Software Engineer',
        job_title: 'Senior Engineer',
        one_sentence_description: 'Experienced engineer with strong technical skills',
        scope_of_influence_summary: 'Team level influence',
        ownership_summary: 'Owns features and components',
        trajectory_notes: 'Path to tech lead roles'
      })
      .execute();

    // Create test criteria for the level
    await db.insert(levelCriteriaTable)
      .values([
        {
          engineering_level_id: 'L3',
          category: 'Craft',
          sub_category: 'Technical Expertise',
          description: 'Strong technical skills in multiple areas'
        },
        {
          engineering_level_id: 'L3',
          category: 'Impact',
          sub_category: 'Planning',
          description: 'Plans and executes medium-sized projects'
        }
      ])
      .execute();

    const result = await getLevelById('L3');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('L3');
    expect(result!.title).toEqual('Senior Software Engineer');
    expect(result!.job_title).toEqual('Senior Engineer');
    expect(result!.one_sentence_description).toEqual('Experienced engineer with strong technical skills');
    expect(result!.scope_of_influence_summary).toEqual('Team level influence');
    expect(result!.ownership_summary).toEqual('Owns features and components');
    expect(result!.trajectory_notes).toEqual('Path to tech lead roles');
    expect(result!.created_at).toBeInstanceOf(Date);
    
    expect(result!.criteria).toHaveLength(2);
    expect(result!.criteria[0].category).toEqual('Craft');
    expect(result!.criteria[0].sub_category).toEqual('Technical Expertise');
    expect(result!.criteria[0].description).toEqual('Strong technical skills in multiple areas');
    expect(result!.criteria[1].category).toEqual('Impact');
    expect(result!.criteria[1].sub_category).toEqual('Planning');
    expect(result!.criteria[1].description).toEqual('Plans and executes medium-sized projects');
  });

  it('should return level with empty criteria array when level has no criteria', async () => {
    // Create test engineering level without criteria
    await db.insert(engineeringLevelsTable)
      .values({
        id: 'TL1',
        title: 'Tech Lead',
        job_title: 'Technical Lead',
        one_sentence_description: 'Technical leader of a team',
        scope_of_influence_summary: 'Multiple teams',
        ownership_summary: 'Owns technical direction',
        trajectory_notes: 'Path to engineering management'
      })
      .execute();

    const result = await getLevelById('TL1');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('TL1');
    expect(result!.title).toEqual('Tech Lead');
    expect(result!.criteria).toHaveLength(0);
  });

  it('should return level with nullable fields as null', async () => {
    // Create minimal engineering level with nullable fields as null
    await db.insert(engineeringLevelsTable)
      .values({
        id: 'L1',
        title: 'Junior Engineer',
        job_title: null,
        one_sentence_description: null,
        scope_of_influence_summary: null,
        ownership_summary: null,
        trajectory_notes: null
      })
      .execute();

    const result = await getLevelById('L1');

    expect(result).not.toBeNull();
    expect(result!.id).toEqual('L1');
    expect(result!.title).toEqual('Junior Engineer');
    expect(result!.job_title).toBeNull();
    expect(result!.one_sentence_description).toBeNull();
    expect(result!.scope_of_influence_summary).toBeNull();
    expect(result!.ownership_summary).toBeNull();
    expect(result!.trajectory_notes).toBeNull();
    expect(result!.criteria).toHaveLength(0);
  });

  it('should return null when level does not exist', async () => {
    const result = await getLevelById('NONEXISTENT');

    expect(result).toBeNull();
  });

  it('should handle criteria with nullable descriptions', async () => {
    // Create test engineering level
    await db.insert(engineeringLevelsTable)
      .values({
        id: 'EM1',
        title: 'Engineering Manager',
        job_title: 'Manager',
        one_sentence_description: 'Manages engineering team',
        scope_of_influence_summary: 'Team management',
        ownership_summary: 'Owns team performance',
        trajectory_notes: 'Path to senior management'
      })
      .execute();

    // Create criteria with null description
    await db.insert(levelCriteriaTable)
      .values([
        {
          engineering_level_id: 'EM1',
          category: 'Leadership',
          sub_category: 'People Management',
          description: 'Manages direct reports effectively'
        },
        {
          engineering_level_id: 'EM1',
          category: 'Strategy',
          sub_category: 'Vision',
          description: null // Null description
        }
      ])
      .execute();

    const result = await getLevelById('EM1');

    expect(result).not.toBeNull();
    expect(result!.criteria).toHaveLength(2);
    expect(result!.criteria[0].description).toEqual('Manages direct reports effectively');
    expect(result!.criteria[1].description).toBeNull();
  });
});