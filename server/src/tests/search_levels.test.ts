import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type SearchInput } from '../schema';
import { searchLevels } from '../handlers/search_levels';

// Test data
const testLevel1 = {
  id: 'L3',
  title: 'Software Engineer III',
  job_title: 'Senior Software Engineer',
  one_sentence_description: 'Experienced developer who can work independently on complex features',
  scope_of_influence_summary: 'Individual contributor with team impact',
  ownership_summary: 'Owns feature development from design to deployment',
  trajectory_notes: 'Path to technical leadership'
};

const testLevel2 = {
  id: 'TL1',
  title: 'Tech Lead I',
  job_title: 'Technical Lead',
  one_sentence_description: 'Leads technical decisions for a small team',
  scope_of_influence_summary: 'Team-level technical influence',
  ownership_summary: 'Owns technical architecture decisions',
  trajectory_notes: 'Path to engineering management or senior technical roles'
};

const testCriteria = [
  {
    engineering_level_id: 'L3',
    category: 'Craft',
    sub_category: 'Technical Expertise',
    description: 'Demonstrates deep knowledge of programming languages and frameworks'
  },
  {
    engineering_level_id: 'L3',
    category: 'Impact',
    sub_category: 'Problem Solving',
    description: 'Solves complex technical problems with minimal guidance'
  },
  {
    engineering_level_id: 'TL1',
    category: 'Leadership',
    sub_category: 'Team Management',
    description: 'Provides technical guidance to junior developers'
  },
  {
    engineering_level_id: 'TL1',
    category: 'Craft',
    sub_category: 'Architecture',
    description: 'Designs scalable systems and makes architectural decisions'
  }
];

describe('searchLevels', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test engineering levels
    await db.insert(engineeringLevelsTable).values([testLevel1, testLevel2]).execute();
    
    // Insert test criteria
    await db.insert(levelCriteriaTable).values(testCriteria).execute();
  });
  
  afterEach(resetDB);

  it('should return empty array for empty query', async () => {
    const input: SearchInput = { query: '' };
    const results = await searchLevels(input);
    
    expect(results).toHaveLength(0);
  });

  it('should return empty array for whitespace-only query', async () => {
    const input: SearchInput = { query: '   ' };
    const results = await searchLevels(input);
    
    expect(results).toHaveLength(0);
  });

  it('should search in job_title field', async () => {
    const input: SearchInput = { query: 'Senior' };
    const results = await searchLevels(input);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].level_id).toBe('L3');
    expect(results[0].level_title).toBe('Software Engineer III');
    expect(results[0].match_snippet).toContain('**Senior**');
  });

  it('should search in one_sentence_description field', async () => {
    const input: SearchInput = { query: 'independently' };
    const results = await searchLevels(input);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].level_id).toBe('L3');
    expect(results[0].match_snippet).toContain('**independently**');
  });

  it('should search in category field', async () => {
    const input: SearchInput = { query: 'Leadership' };
    const results = await searchLevels(input);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].level_id).toBe('TL1');
    expect(results[0].category).toBe('Leadership');
    expect(results[0].match_snippet).toContain('**Leadership**');
  });

  it('should search in sub_category field', async () => {
    const input: SearchInput = { query: 'Architecture' };
    const results = await searchLevels(input);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].level_id).toBe('TL1');
    expect(results[0].sub_category).toBe('Architecture');
    expect(results[0].match_snippet).toContain('**Architecture**');
  });

  it('should search in description field', async () => {
    const input: SearchInput = { query: 'programming languages' };
    const results = await searchLevels(input);
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].level_id).toBe('L3');
    expect(results[0].description).toContain('programming languages');
    expect(results[0].match_snippet).toContain('**programming languages**');
  });

  it('should perform case-insensitive search', async () => {
    const input: SearchInput = { query: 'TECHNICAL' };
    const results = await searchLevels(input);
    
    expect(results.length).toBeGreaterThan(0);
    // Should match both "Technical" in job_title and "technical" in descriptions
    const levelIds = results.map(r => r.level_id);
    expect(levelIds).toContain('TL1');
  });

  it('should return multiple results for broad search terms', async () => {
    const input: SearchInput = { query: 'technical' };
    const results = await searchLevels(input);
    
    expect(results.length).toBeGreaterThan(1);
    // Should match multiple criteria across different levels
    const uniqueLevelIds = [...new Set(results.map(r => r.level_id))];
    expect(uniqueLevelIds.length).toBeGreaterThan(0);
  });

  it('should include all required fields in search results', async () => {
    const input: SearchInput = { query: 'complex' };
    const results = await searchLevels(input);
    
    expect(results.length).toBeGreaterThan(0);
    const result = results[0];
    
    expect(result.level_id).toBeDefined();
    expect(result.level_title).toBeDefined();
    expect(result.category).toBeDefined();
    expect(result.sub_category).toBeDefined();
    expect(result.description).toBeDefined();
    expect(result.match_snippet).toBeDefined();
  });

  it('should create meaningful match snippets', async () => {
    const input: SearchInput = { query: 'scalable' };
    const results = await searchLevels(input);
    
    expect(results.length).toBeGreaterThan(0);
    const result = results[0];
    
    expect(result.match_snippet).toContain('**scalable**');
    expect(result.match_snippet.length).toBeGreaterThan(10); // Should have context
  });

  it('should handle partial word matches', async () => {
    const input: SearchInput = { query: 'develop' };
    const results = await searchLevels(input);
    
    expect(results.length).toBeGreaterThan(0);
    // Should match "developer", "development", etc.
    const snippets = results.map(r => r.match_snippet).join(' ');
    expect(snippets.toLowerCase()).toContain('develop');
  });

  it('should remove duplicate level-category-subcategory combinations', async () => {
    // This test ensures that if the same criteria matches multiple times,
    // we only return it once
    const input: SearchInput = { query: 'Craft' };
    const results = await searchLevels(input);
    
    // Count occurrences of each unique combination
    const combinations = results.map(r => `${r.level_id}_${r.category}_${r.sub_category}`);
    const uniqueCombinations = [...new Set(combinations)];
    
    expect(combinations.length).toBe(uniqueCombinations.length);
  });

  it('should handle search with no matches', async () => {
    const input: SearchInput = { query: 'nonexistentterm' };
    const results = await searchLevels(input);
    
    expect(results).toHaveLength(0);
  });

  it('should handle special characters in search query', async () => {
    const input: SearchInput = { query: 'C++' };
    const results = await searchLevels(input);
    
    // Should not throw error, even if no matches
    expect(Array.isArray(results)).toBe(true);
  });

  it('should truncate long snippets with ellipsis', async () => {
    // Insert a level with a very long description
    const longDescription = 'This is a very long description that goes on and on about technical expertise and programming languages and frameworks and many other technical topics that should be truncated in the snippet output';
    
    await db.insert(levelCriteriaTable).values({
      engineering_level_id: 'L3',
      category: 'Test',
      sub_category: 'Long Description',
      description: longDescription
    }).execute();

    const input: SearchInput = { query: 'frameworks' };
    const results = await searchLevels(input);
    
    const longResult = results.find(r => r.sub_category === 'Long Description');
    expect(longResult).toBeDefined();
    
    if (longResult) {
      // Should contain ellipsis for truncation
      expect(longResult.match_snippet).toMatch(/\.\.\./);
      expect(longResult.match_snippet).toContain('**frameworks**');
    }
  });
});