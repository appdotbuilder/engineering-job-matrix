import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { engineeringLevelsTable } from '../db/schema';
import { type CreateEngineeringLevelInput } from '../schema';
import { createEngineeringLevel } from '../handlers/create_engineering_level';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateEngineeringLevelInput = {
  id: 'L3',
  title: 'Senior Software Engineer',
  job_title: 'Senior Engineer',
  one_sentence_description: 'A senior engineer with significant technical expertise',
  scope_of_influence_summary: 'Team-level impact on technical decisions',
  ownership_summary: 'Owns features and technical components',
  trajectory_notes: 'Path to technical leadership or staff engineering'
};

// Test input with minimal required fields and nullable fields
const minimalInput: CreateEngineeringLevelInput = {
  id: 'TL1',
  title: 'Tech Lead',
  job_title: null,
  one_sentence_description: null,
  scope_of_influence_summary: null,
  ownership_summary: null,
  trajectory_notes: null
};

describe('createEngineeringLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an engineering level with all fields', async () => {
    const result = await createEngineeringLevel(testInput);

    // Validate all fields
    expect(result.id).toEqual('L3');
    expect(result.title).toEqual('Senior Software Engineer');
    expect(result.job_title).toEqual('Senior Engineer');
    expect(result.one_sentence_description).toEqual('A senior engineer with significant technical expertise');
    expect(result.scope_of_influence_summary).toEqual('Team-level impact on technical decisions');
    expect(result.ownership_summary).toEqual('Owns features and technical components');
    expect(result.trajectory_notes).toEqual('Path to technical leadership or staff engineering');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an engineering level with minimal fields', async () => {
    const result = await createEngineeringLevel(minimalInput);

    // Validate required fields
    expect(result.id).toEqual('TL1');
    expect(result.title).toEqual('Tech Lead');
    expect(result.job_title).toBeNull();
    expect(result.one_sentence_description).toBeNull();
    expect(result.scope_of_influence_summary).toBeNull();
    expect(result.ownership_summary).toBeNull();
    expect(result.trajectory_notes).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save engineering level to database', async () => {
    const result = await createEngineeringLevel(testInput);

    // Query the database to verify the level was saved
    const levels = await db.select()
      .from(engineeringLevelsTable)
      .where(eq(engineeringLevelsTable.id, result.id))
      .execute();

    expect(levels).toHaveLength(1);
    expect(levels[0].id).toEqual('L3');
    expect(levels[0].title).toEqual('Senior Software Engineer');
    expect(levels[0].job_title).toEqual('Senior Engineer');
    expect(levels[0].one_sentence_description).toEqual('A senior engineer with significant technical expertise');
    expect(levels[0].scope_of_influence_summary).toEqual('Team-level impact on technical decisions');
    expect(levels[0].ownership_summary).toEqual('Owns features and technical components');
    expect(levels[0].trajectory_notes).toEqual('Path to technical leadership or staff engineering');
    expect(levels[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when creating level with duplicate ID', async () => {
    // Create the first level
    await createEngineeringLevel(testInput);

    // Attempt to create another level with the same ID
    const duplicateInput: CreateEngineeringLevelInput = {
      id: 'L3', // Same ID as testInput
      title: 'Different Title',
      job_title: null,
      one_sentence_description: null,
      scope_of_influence_summary: null,
      ownership_summary: null,
      trajectory_notes: null
    };

    // Should throw an error about duplicate ID
    await expect(createEngineeringLevel(duplicateInput))
      .rejects
      .toThrow(/already exists/i);
  });

  it('should handle various engineering level ID formats', async () => {
    const testCases: CreateEngineeringLevelInput[] = [
      {
        id: 'EM2',
        title: 'Engineering Manager',
        job_title: null,
        one_sentence_description: null,
        scope_of_influence_summary: null,
        ownership_summary: null,
        trajectory_notes: null
      },
      {
        id: 'L1/L2',
        title: 'Junior/Mid Engineer',
        job_title: null,
        one_sentence_description: null,
        scope_of_influence_summary: null,
        ownership_summary: null,
        trajectory_notes: null
      },
      {
        id: 'STAFF',
        title: 'Staff Engineer',
        job_title: null,
        one_sentence_description: null,
        scope_of_influence_summary: null,
        ownership_summary: null,
        trajectory_notes: null
      }
    ];

    // Create all test levels
    const results = await Promise.all(
      testCases.map(input => createEngineeringLevel(input))
    );

    // Verify all were created successfully
    expect(results).toHaveLength(3);
    expect(results[0].id).toEqual('EM2');
    expect(results[1].id).toEqual('L1/L2');
    expect(results[2].id).toEqual('STAFF');

    // Verify they exist in database
    const dbLevels = await db.select()
      .from(engineeringLevelsTable)
      .execute();

    expect(dbLevels).toHaveLength(3);
    const dbIds = dbLevels.map(level => level.id).sort();
    expect(dbIds).toEqual(['EM2', 'L1/L2', 'STAFF']);
  });

  it('should preserve created_at timestamp correctly', async () => {
    const beforeCreation = new Date();
    const result = await createEngineeringLevel(testInput);
    const afterCreation = new Date();

    // The created_at should be between before and after timestamps
    expect(result.created_at >= beforeCreation).toBe(true);
    expect(result.created_at <= afterCreation).toBe(true);

    // Verify in database
    const dbLevel = await db.select()
      .from(engineeringLevelsTable)
      .where(eq(engineeringLevelsTable.id, result.id))
      .execute();

    expect(dbLevel[0].created_at).toBeInstanceOf(Date);
    expect(dbLevel[0].created_at.getTime()).toEqual(result.created_at.getTime());
  });
});