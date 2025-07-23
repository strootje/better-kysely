import { lessOrEqual, parse } from "@std/semver";
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

const keyval = <TKey extends keyof any, TVal>(obj: Record<TKey, TVal>) => {
  return (Object.keys(obj) as TKey[]).map((key) => ({ key, value: obj[key] }));
};

type MigrationBuilderApi = {
  upto: <
    TMigrations extends Record<string, { version: string }>,
    TVersions extends TMigrations[keyof TMigrations]["version"],
  >(migrations: TMigrations, to: TVersions) => Record<string, Migration>;
};
export const buildMigrations = (
  builder: (api: MigrationBuilderApi) => Record<string, Migration>,
): Record<string, Migration> => {
  const seen: Array<string> = [];
  const api: MigrationBuilderApi = {
    upto(migrations, to) {
      const toVer = parse(to);
      return keyval(migrations)
        .filter(({ key, value }) => lessOrEqual(parse(value.version), toVer) && !seen.includes(key))
        .reduce((prev, { key, value: { version: _version, ...rest } }) => {
          seen.push(key);
          return ({ ...prev, [key]: rest });
        }, {});
    },
  };

  let counter = 0;
  return keyval(builder(api))
    .reduce((prev, { key, value }) => ({ ...prev, [`${counter++}__${key}`]: value }), {});
};
