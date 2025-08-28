import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { getMatrixOverview } from '../handlers/get_matrix_overview';

describe('getMatrixOverview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty structure when no data exists', async () => {
    const result = await getMatrixOverview();

    expect(result.categories).toEqual([]);
    expect(result.sub_categories).toEqual({});
    expect(result.level_ids).toEqual([]);
    expect(result.level_groups).toEqual({
      IC: [],
      TL: [],
      EM: []
    });
  });

  it('should return proper overview with sample data', async () => {
    // Create sample engineering levels
    await db.insert(engineeringLevelsTable).values([
      {
        id: 'L1/L2',
        title: 'Entry Level Software Engineer',
        job_title: 'Software Engineer I/II',
        one_sentence_description: 'Learning the fundamentals',
        scope_of_influence_summary: 'Individual contributions',
        ownership_summary: 'Own small features',
        trajectory_notes: 'Focus on growth'
      },
      {
        id: 'L3',
        title: 'Software Engineer',
        job_title: 'Software Engineer III',
        one_sentence_description: 'Productive individual contributor',
        scope_of_influence_summary: 'Team member',
        ownership_summary: 'Own features and small projects',
        trajectory_notes: 'Building expertise'
      },
      {
        id: 'TL1',
        title: 'Tech Lead',
        job_title: 'Senior Software Engineer',
        one_sentence_description: 'Technical leadership',
        scope_of_influence_summary: 'Team technical direction',
        ownership_summary: 'Own technical decisions',
        trajectory_notes: 'Leadership development'
      },
      {
        id: 'EM1',
        title: 'Engineering Manager',
        job_title: 'Engineering Manager',
        one_sentence_description: 'People and project management',
        scope_of_influence_summary: 'Team management',
        ownership_summary: 'Own team outcomes',
        trajectory_notes: 'Management track'
      }
    ]).execute();

    // Create sample level criteria
    await db.insert(levelCriteriaTable).values([
      {
        engineering_level_id: 'L1/L2',
        category: 'Craft',
        sub_category: 'Technical Expertise',
        description: 'Learning fundamentals'
      },
      {
        engineering_level_id: 'L1/L2',
        category: 'Craft',
        sub_category: 'System Design',
        description: 'Basic understanding'
      },
      {
        engineering_level_id: 'L1/L2',
        category: 'Impact',
        sub_category: 'Planning',
        description: 'Follow plans'
      },
      {
        engineering_level_id: 'L3',
        category: 'Craft',
        sub_category: 'Technical Expertise',
        description: 'Solid technical skills'
      },
      {
        engineering_level_id: 'L3',
        category: 'Growth',
        sub_category: 'Mentorship',
        description: 'Help junior developers'
      },
      {
        engineering_level_id: 'TL1',
        category: 'Impact',
        sub_category: 'Leadership',
        description: 'Technical leadership'
      },
      {
        engineering_level_id: 'EM1',
        category: 'Growth',
        sub_category: 'People Management',
        description: 'Manage team members'
      }
    ]).execute();

    const result = await getMatrixOverview();

    // Verify categories are unique and sorted
    expect(result.categories).toEqual(['Craft', 'Growth', 'Impact']);

    // Verify sub_categories are grouped correctly by category
    expect(result.sub_categories).toEqual({
      'Craft': ['System Design', 'Technical Expertise'],
      'Growth': ['Mentorship', 'People Management'],
      'Impact': ['Leadership', 'Planning']
    });

    // Verify level IDs are present and sorted
    expect(result.level_ids).toEqual(['EM1', 'L1/L2', 'L3', 'TL1']);

    // Verify level groups are categorized correctly
    expect(result.level_groups).toEqual({
      IC: ['L1/L2', 'L3'],
      TL: ['TL1'],
      EM: ['EM1']
    });
  });

  it('should handle complex level groupings', async () => {
    // Create levels with various naming patterns
    await db.insert(engineeringLevelsTable).values([
      { id: 'L4', title: 'Senior Engineer' },
      { id: 'L5', title: 'Staff Engineer' },
      { id: 'L6', title: 'Principal Engineer' },
      { id: 'TL2', title: 'Senior Tech Lead' },
      { id: 'EM2', title: 'Senior Engineering Manager' },
      { id: 'EM3', title: 'Director of Engineering' }
    ]).execute();

    const result = await getMatrixOverview();

    expect(result.level_groups).toEqual({
      IC: ['L4', 'L5', 'L6'],
      TL: ['TL2'],
      EM: ['EM2', 'EM3']
    });

    expect(result.level_ids).toEqual(['EM2', 'EM3', 'L4', 'L5', 'L6', 'TL2']);
  });

  it('should handle duplicate categories and sub_categories correctly', async () => {
    // Create levels
    await db.insert(engineeringLevelsTable).values([
      { id: 'L1', title: 'Junior Engineer' },
      { id: 'L2', title: 'Engineer' }
    ]).execute();

    // Create criteria with overlapping categories
    await db.insert(levelCriteriaTable).values([
      {
        engineering_level_id: 'L1',
        category: 'Craft',
        sub_category: 'Technical Expertise',
        description: 'Basic skills'
      },
      {
        engineering_level_id: 'L2',
        category: 'Craft',
        sub_category: 'Technical Expertise',
        description: 'Intermediate skills'
      },
      {
        engineering_level_id: 'L1',
        category: 'Craft',
        sub_category: 'Code Review',
        description: 'Learning to review'
      },
      {
        engineering_level_id: 'L2',
        category: 'Craft',
        sub_category: 'Code Review',
        description: 'Regular reviewer'
      }
    ]).execute();

    const result = await getMatrixOverview();

    // Should have unique categories and sub_categories
    expect(result.categories).toEqual(['Craft']);
    expect(result.sub_categories).toEqual({
      'Craft': ['Code Review', 'Technical Expertise']
    });
  });

  it('should handle levels with no criteria', async () => {
    // Create levels but no criteria
    await db.insert(engineeringLevelsTable).values([
      { id: 'L3', title: 'Software Engineer' },
      { id: 'EM1', title: 'Engineering Manager' }
    ]).execute();

    const result = await getMatrixOverview();

    expect(result.categories).toEqual([]);
    expect(result.sub_categories).toEqual({});
    expect(result.level_ids).toEqual(['EM1', 'L3']);
    expect(result.level_groups).toEqual({
      IC: ['L3'],
      TL: [],
      EM: ['EM1']
    });
  });

  it('should sort sub_categories within each category', async () => {
    await db.insert(engineeringLevelsTable).values([
      { id: 'L3', title: 'Software Engineer' }
    ]).execute();

    await db.insert(levelCriteriaTable).values([
      {
        engineering_level_id: 'L3',
        category: 'Craft',
        sub_category: 'System Design',
        description: 'Design systems'
      },
      {
        engineering_level_id: 'L3',
        category: 'Craft',
        sub_category: 'Architecture',
        description: 'Understand architecture'
      },
      {
        engineering_level_id: 'L3',
        category: 'Craft',
        sub_category: 'Technical Expertise',
        description: 'Technical skills'
      }
    ]).execute();

    const result = await getMatrixOverview();

    expect(result.sub_categories['Craft']).toEqual([
      'Architecture',
      'System Design', 
      'Technical Expertise'
    ]);
  });
});