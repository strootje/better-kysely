import { lessOrEqual, type SemVer } from "@std/semver";
import { type Dialect, Kysely, type Migration, type MigrationResult, Migrator } from "kysely";

type DatabaseApi<T> = {
  useDatabase: () => Kysely<T>;
  useMigrator: () => Migrator;
  migrateToLatest: () => Promise<MigrationResult[] | undefined>;
};

type MigrationsFn = () => Promise<Record<string, Migration>>;
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

const keyVal = <TKey extends keyof any, TVal>(obj: Record<TKey, TVal>) => {
  return (Object.keys(obj) as TKey[]).map((key) => ({ key, value: obj[key] }));
};

type MigrationBuilderApi = {
  upto: (migrations: Record<string, Migration & { version: SemVer }>, to: SemVer) => Record<string, Migration>;
};
export const buildMigrations = (
  builder: (api: MigrationBuilderApi) => Record<string, Migration>,
): Record<string, Migration> => {
  const seen: Array<string> = [];
  let counter = 0;

  const api: MigrationBuilderApi = {
    upto(migrations, to) {
      return keyVal(migrations)
        .filter(({ key, value }) => lessOrEqual(value.version, to) && !seen.includes(key))
        .reduce((prev, { key, value: { up, down } }) => {
          seen.push(key);
          return ({ ...prev, [key]: { up, down } });
        }, {});
    },
  };

  return keyVal(builder(api)).reduce((prev, { key, value }) => ({ ...prev, [`${counter++}__${key}`]: value }), {});
};
