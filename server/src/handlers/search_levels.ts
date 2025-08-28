import { db } from '../db';
import { engineeringLevelsTable, levelCriteriaTable } from '../db/schema';
import { type SearchInput, type SearchResult } from '../schema';
import { eq, or, ilike } from 'drizzle-orm';

export async function searchLevels(input: SearchInput): Promise<SearchResult[]> {
  try {
    const query = input.query.trim();
    
    if (!query) {
      return [];
    }

    // Create search pattern for ILIKE operations
    const searchPattern = `%${query}%`;
    
    // Search across engineering levels and their criteria
    const results = await db.select({
      level_id: engineeringLevelsTable.id,
      level_title: engineeringLevelsTable.title,
      level_job_title: engineeringLevelsTable.job_title,
      level_one_sentence_description: engineeringLevelsTable.one_sentence_description,
      criteria_category: levelCriteriaTable.category,
      criteria_sub_category: levelCriteriaTable.sub_category,
      criteria_description: levelCriteriaTable.description
    })
    .from(engineeringLevelsTable)
    .innerJoin(levelCriteriaTable, eq(levelCriteriaTable.engineering_level_id, engineeringLevelsTable.id))
    .where(
      or(
        ilike(engineeringLevelsTable.job_title, searchPattern),
        ilike(engineeringLevelsTable.one_sentence_description, searchPattern),
        ilike(levelCriteriaTable.category, searchPattern),
        ilike(levelCriteriaTable.sub_category, searchPattern),
        ilike(levelCriteriaTable.description, searchPattern)
      )
    )
    .execute();

    // Process results and create snippets
    const searchResults: SearchResult[] = [];
    
    for (const result of results) {
      const matchSnippet = createMatchSnippet(query, {
        job_title: result.level_job_title,
        one_sentence_description: result.level_one_sentence_description,
        category: result.criteria_category,
        sub_category: result.criteria_sub_category,
        description: result.criteria_description
      });

      searchResults.push({
        level_id: result.level_id,
        level_title: result.level_title,
        category: result.criteria_category,
        sub_category: result.criteria_sub_category,
        description: result.criteria_description || '',
        match_snippet: matchSnippet
      });
    }

    // Remove duplicates based on level_id + category + sub_category combination
    const uniqueResults = searchResults.filter((result, index, arr) => {
      const key = `${result.level_id}_${result.category}_${result.sub_category}`;
      return arr.findIndex(r => `${r.level_id}_${r.category}_${r.sub_category}` === key) === index;
    });

    return uniqueResults;
  } catch (error) {
    console.error('Search operation failed:', error);
    throw error;
  }
}

function createMatchSnippet(query: string, fields: {
  job_title: string | null;
  one_sentence_description: string | null;
  category: string;
  sub_category: string;
  description: string | null;
}): string {
  const queryLower = query.toLowerCase();
  
  // Check each field for matches and create snippet
  const fieldsToCheck = [
    { name: 'job_title', value: fields.job_title },
    { name: 'description', value: fields.one_sentence_description },
    { name: 'category', value: fields.category },
    { name: 'sub_category', value: fields.sub_category },
    { name: 'criteria', value: fields.description }
  ];

  for (const field of fieldsToCheck) {
    if (field.value && field.value.toLowerCase().includes(queryLower)) {
      const text = field.value;
      const index = text.toLowerCase().indexOf(queryLower);
      
      // Create snippet with context around the match
      const start = Math.max(0, index - 30);
      const end = Math.min(text.length, index + query.length + 30);
      let snippet = text.substring(start, end);
      
      // Add ellipsis if truncated
      if (start > 0) snippet = '...' + snippet;
      if (end < text.length) snippet = snippet + '...';
      
      // Highlight the matched term (case-insensitive)
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      snippet = snippet.replace(regex, '**$1**');
      
      return snippet;
    }
  }

  // Fallback if no specific match found (shouldn't happen due to WHERE clause)
  return `Match found in ${fields.category} - ${fields.sub_category}`;
}