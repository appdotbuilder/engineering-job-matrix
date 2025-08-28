import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type FilterInput } from '../schema';
import { getFilteredLevels } from '../handlers/get_filtered_levels';

// Test data setup
const testLevel1 = {
  id: 'L3',
  title: 'Software Engineer III',
  job_title: 'Senior Software Engineer',
  one_sentence_description: 'Experienced individual contributor',
  scope_of_influence_summary: 'Team level impact',
  ownership_summary: 'Owns features and technical decisions',
  trajectory_notes: 'Path to senior roles'
};

const testLevel2 = {
  id: 'TL1',
  title: 'Tech Lead I',
  job_title: 'Technical Lead',
  one_sentence_description: 'Technical leadership role',
  scope_of_influence_summary: 'Multi-team technical influence',
  ownership_summary: 'Owns technical architecture decisions',
  trajectory_notes: 'Leadership track'
};

const testCriteria = [
  {
    engineering_level_id: 'L3',
    category: 'Craft',
    sub_category: 'Technical Expertise',
    description: 'Strong technical skills in core technologies'
  },
  {
    engineering_level_id: 'L3',
    category: 'Impact',
    sub_category: 'Planning',
    description: 'Plans and executes feature development'
  },
  {
    engineering_level_id: 'TL1',
    category: 'Craft',
    sub_category: 'Technical Expertise',
    description: 'Expert-level technical skills and architecture knowledge'
  },
  {
    engineering_level_id: 'TL1',
    category: 'Growth',
    sub_category: 'Mentoring',
    description: 'Mentors team members and guides technical growth'
  }
];

describe('getFilteredLevels', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test levels
    await db.insert(engineeringLevelsTable).values([testLevel1, testLevel2]).execute();
    
    // Insert test criteria
    await db.insert(levelCriteriaTable).values(testCriteria).execute();
  });
  
  afterEach(resetDB);

  it('should return all levels with all criteria when no filters provided', async () => {
    const input: FilterInput = {};
    const result = await getFilteredLevels(input);

    expect(result).toHaveLength(2);
    
    // Check L3 level
    const l3Level = result.find(level => level.id === 'L3');
    expect(l3Level).toBeDefined();
    expect(l3Level!.title).toEqual('Software Engineer III');
    expect(l3Level!.job_title).toEqual('Senior Software Engineer');
    expect(l3Level!.criteria).toHaveLength(2);
    expect(l3Level!.criteria.map(c => c.category)).toContain('Craft');
    expect(l3Level!.criteria.map(c => c.category)).toContain('Impact');
    
    // Check TL1 level
    const tl1Level = result.find(level => level.id === 'TL1');
    expect(tl1Level).toBeDefined();
    expect(tl1Level!.title).toEqual('Tech Lead I');
    expect(tl1Level!.criteria).toHaveLength(2);
    expect(tl1Level!.criteria.map(c => c.category)).toContain('Craft');
    expect(tl1Level!.criteria.map(c => c.category)).toContain('Growth');
  });

  it('should filter levels by single category', async () => {
    const input: FilterInput = {
      categories: ['Craft']
    };
    const result = await getFilteredLevels(input);

    expect(result).toHaveLength(2);
    
    // Both levels should have only Craft criteria
    result.forEach(level => {
      expect(level.criteria.length).toBeGreaterThan(0);
      level.criteria.forEach(criterion => {
        expect(criterion.category).toEqual('Craft');
      });
    });
    
    // L3 should have 1 Craft criterion
    const l3Level = result.find(level => level.id === 'L3');
    expect(l3Level!.criteria).toHaveLength(1);
    expect(l3Level!.criteria[0].sub_category).toEqual('Technical Expertise');
    
    // TL1 should have 1 Craft criterion
    const tl1Level = result.find(level => level.id === 'TL1');
    expect(tl1Level!.criteria).toHaveLength(1);
    expect(tl1Level!.criteria[0].sub_category).toEqual('Technical Expertise');
  });

  it('should filter levels by multiple categories', async () => {
    const input: FilterInput = {
      categories: ['Craft', 'Growth']
    };
    const result = await getFilteredLevels(input);

    expect(result).toHaveLength(2);
    
    // Check that only Craft and Growth criteria are included
    result.forEach(level => {
      level.criteria.forEach(criterion => {
        expect(['Craft', 'Growth']).toContain(criterion.category);
      });
    });
    
    // L3 should have only 1 criterion (Craft)
    const l3Level = result.find(level => level.id === 'L3');
    expect(l3Level!.criteria).toHaveLength(1);
    expect(l3Level!.criteria[0].category).toEqual('Craft');
    
    // TL1 should have 2 criteria (Craft and Growth)
    const tl1Level = result.find(level => level.id === 'TL1');
    expect(tl1Level!.criteria).toHaveLength(2);
    expect(tl1Level!.criteria.map(c => c.category)).toContain('Craft');
    expect(tl1Level!.criteria.map(c => c.category)).toContain('Growth');
  });

  it('should filter levels by single sub-category', async () => {
    const input: FilterInput = {
      sub_categories: ['Technical Expertise']
    };
    const result = await getFilteredLevels(input);

    expect(result).toHaveLength(2);
    
    // Both levels should have exactly one criterion with Technical Expertise
    result.forEach(level => {
      expect(level.criteria).toHaveLength(1);
      expect(level.criteria[0].sub_category).toEqual('Technical Expertise');
    });
  });

  it('should filter levels by multiple sub-categories', async () => {
    const input: FilterInput = {
      sub_categories: ['Technical Expertise', 'Mentoring']
    };
    const result = await getFilteredLevels(input);

    expect(result).toHaveLength(2);
    
    // Check that only specified sub-categories are included
    result.forEach(level => {
      level.criteria.forEach(criterion => {
        expect(['Technical Expertise', 'Mentoring']).toContain(criterion.sub_category);
      });
    });
    
    // L3 should have 1 criterion (Technical Expertise only)
    const l3Level = result.find(level => level.id === 'L3');
    expect(l3Level!.criteria).toHaveLength(1);
    expect(l3Level!.criteria[0].sub_category).toEqual('Technical Expertise');
    
    // TL1 should have 2 criteria (Technical Expertise and Mentoring)
    const tl1Level = result.find(level => level.id === 'TL1');
    expect(tl1Level!.criteria).toHaveLength(2);
    expect(tl1Level!.criteria.map(c => c.sub_category)).toContain('Technical Expertise');
    expect(tl1Level!.criteria.map(c => c.sub_category)).toContain('Mentoring');
  });

  it('should filter levels by both categories and sub-categories', async () => {
    const input: FilterInput = {
      categories: ['Craft'],
      sub_categories: ['Technical Expertise']
    };
    const result = await getFilteredLevels(input);

    expect(result).toHaveLength(2);
    
    // Both levels should have exactly one criterion matching both filters
    result.forEach(level => {
      expect(level.criteria).toHaveLength(1);
      expect(level.criteria[0].category).toEqual('Craft');
      expect(level.criteria[0].sub_category).toEqual('Technical Expertise');
    });
  });

  it('should return empty criteria arrays when filters match no criteria', async () => {
    const input: FilterInput = {
      categories: ['NonExistentCategory']
    };
    const result = await getFilteredLevels(input);

    // Should still return levels but with empty criteria arrays
    expect(result).toHaveLength(2);
    result.forEach(level => {
      expect(level.criteria).toHaveLength(0);
    });
  });

  it('should handle levels with no criteria', async () => {
    // Insert a level with no criteria
    const levelWithoutCriteria = {
      id: 'EM1',
      title: 'Engineering Manager I',
      job_title: 'Engineering Manager',
      one_sentence_description: 'People management role',
      scope_of_influence_summary: 'Team management',
      ownership_summary: 'Owns team delivery and people growth',
      trajectory_notes: 'Management track'
    };
    
    await db.insert(engineeringLevelsTable).values(levelWithoutCriteria).execute();

    const input: FilterInput = {};
    const result = await getFilteredLevels(input);

    expect(result).toHaveLength(3);
    
    const emLevel = result.find(level => level.id === 'EM1');
    expect(emLevel).toBeDefined();
    expect(emLevel!.title).toEqual('Engineering Manager I');
    expect(emLevel!.criteria).toHaveLength(0);
  });

  it('should return results sorted by level id', async () => {
    const input: FilterInput = {};
    const result = await getFilteredLevels(input);

    expect(result).toHaveLength(2);
    expect(result[0].id).toEqual('L3');
    expect(result[1].id).toEqual('TL1');
  });

  it('should handle empty filter arrays', async () => {
    const input: FilterInput = {
      categories: [],
      sub_categories: []
    };
    const result = await getFilteredLevels(input);

    // Empty arrays should be treated same as no filters
    expect(result).toHaveLength(2);
    
    const l3Level = result.find(level => level.id === 'L3');
    expect(l3Level!.criteria).toHaveLength(2);
    
    const tl1Level = result.find(level => level.id === 'TL1');
    expect(tl1Level!.criteria).toHaveLength(2);
  });
});