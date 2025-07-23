import { type Dialect, Kysely, type Migration, Migrator } from "kysely";

type MigrationsFn = () => Promise<Record<string, Migration>>;
export const makeDatabase = <T>(dialect: Dialect, getMigrations: MigrationsFn) => {
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
