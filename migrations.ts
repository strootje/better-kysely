import { lessOrEqual, lessThan, parse } from "@std/semver";
import type { Migration } from "kysely";

type MigraitonList = Record<string, Migration & { version: string }>;
type Migrations<TVersion extends string> = Record<string, Migration & { version: TVersion }>;
type Modules<TVersion extends string, TModules extends string> = Record<TModules, Migrations<TVersion>> & {
  core: Migrations<TVersion>;
};

export const build = <TVersion extends string, TModules extends string>(
  { core, ...modules }: Modules<TVersion, TModules>,
) => {
  return (...plugins: Array<keyof typeof modules>) => {
    return plugins.reduce((prev, cur) => ({ ...prev, ...(modules[cur as keyof typeof modules]) }), core);
  };
};

const keyval = <TKey extends string, TVal>(obj: Record<TKey, TVal>) => {
  return (Object.keys(obj) as TKey[]).map((key) => ({ key, value: obj[key] }));
};

export const countup = (migrations: MigraitonList, counter: number = 0): MigraitonList => {
  return keyval(migrations)
    .map(({ key, value }) => ({ key, value: { ...value, semver: parse(value.version) } }))
    .toSorted(({ value: { semver: a } }, { value: { semver: b } }) => lessThan(a, b) ? -1 : 1)
    .reduce((prev, { key, value }) => ({ ...prev, [`${String(++counter).padStart(5, "0")}__${key}`]: value }), {});
};

export const dedupe = (migrations: MigraitonList, ignore: Array<string> = []): MigraitonList => {
  return keyval(migrations)
    .filter(({ key }) => !ignore.includes(key))
    .reduce((prev, { key, value }) => {
      ignore.push(key);
      return ({ ...prev, [key]: value });
    }, {});
};

export const pin = <
  TMigrations extends Record<string, { version: string }>,
  TVersions extends TMigrations[keyof TMigrations]["version"],
>(migrations: TMigrations, to: TVersions): MigraitonList => {
  const toVer = parse(to);
  return keyval(migrations)
    .filter(({ value }) => lessOrEqual(parse(value.version), toVer))
    .reduce((prev, { key, value }) => ({ ...prev, [key]: value }), {});
};
