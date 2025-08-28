import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  searchInputSchema,
  filterInputSchema,
  comparisonInputSchema,
  createEngineeringLevelInputSchema,
  createLevelCriterionInputSchema
} from './schema';

// Import handlers
import { getAllLevels } from './handlers/get_all_levels';
import { getLevelById } from './handlers/get_level_by_id';
import { searchLevels } from './handlers/search_levels';
import { getFilteredLevels } from './handlers/get_filtered_levels';
import { compareLevels } from './handlers/compare_levels';
import { getMatrixOverview } from './handlers/get_matrix_overview';
import { createEngineeringLevel } from './handlers/create_engineering_level';
import { createLevelCriterion } from './handlers/create_level_criterion';
import { seedDatabase } from './handlers/seed_data';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Get all engineering levels with their criteria
  getAllLevels: publicProcedure
    .query(() => getAllLevels()),

  // Get a specific engineering level by ID
  getLevelById: publicProcedure
    .input(z.object({ levelId: z.string() }))
    .query(({ input }) => getLevelById(input.levelId)),

  // Search across engineering levels and criteria
  searchLevels: publicProcedure
    .input(searchInputSchema)
    .query(({ input }) => searchLevels(input)),

  // Get filtered engineering levels based on categories/sub-categories
  getFilteredLevels: publicProcedure
    .input(filterInputSchema)
    .query(({ input }) => getFilteredLevels(input)),

  // Compare multiple engineering levels
  compareLevels: publicProcedure
    .input(comparisonInputSchema)
    .query(({ input }) => compareLevels(input)),

  // Get job matrix overview for navigation and filtering
  getMatrixOverview: publicProcedure
    .query(() => getMatrixOverview()),

  // Create a new engineering level
  createEngineeringLevel: publicProcedure
    .input(createEngineeringLevelInputSchema)
    .mutation(({ input }) => createEngineeringLevel(input)),

  // Create a new level criterion
  createLevelCriterion: publicProcedure
    .input(createLevelCriterionInputSchema)
    .mutation(({ input }) => createLevelCriterion(input)),

  // Seed database with initial data
  seedDatabase: publicProcedure
    .mutation(() => seedDatabase())
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();