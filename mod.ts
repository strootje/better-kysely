import { type Dialect, Kysely, type Migration, type MigrationResult, Migrator } from "kysely";

type DatabaseApi<T> = {
  useDatabase: () => Kysely<T>;
  useMigrator: () => Migrator;
  migrateToLatest: () => Promise<MigrationResult[] | undefined>;
};

type MigrationsFn = () => Promise<Record<string, Migration>>;
/**
 * Builds a database
 *
 * @example
 * ```ts
 * import { makeDatabase } from '@strootje/better-kysely';
 *
 * const getDialect = () => {
 *   return dialect ??= ....
 * }
 *
 * export const serverDb = makeDatabase(getDialect(), () => Promise.resolve({
 *   m001_myMigration
 * }))
 * ```
 *
 * @param dialect Dialect to use
 * @param getMigrations Migration strategy
 * @returns @see DatabaseApi
 */
export const makeDatabase = <T>(dialect: Dialect, getMigrations: MigrationsFn): DatabaseApi<T> => {
  let kysely: Kysely<T>;

  const api = {
    useDatabase: () => {
      return kysely ??= new Kysely<T>({
        dialect: dialect,
      });
    },

    useMigrator: () => {
      return new Migrator({
        provider: { getMigrations },
        db: api.useDatabase(),
      });
    },

    migrateToLatest: async () => {
      const migrator = api.useMigrator();
      const { error, results } = await migrator.migrateToLatest();
      if (error) throw error;
      return results;
    },
  };

  return api;
};
