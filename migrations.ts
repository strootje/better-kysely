import { lessOrEqual, parse } from "@std/semver";
import type { Migration } from "kysely";

type MigraitonList<T = Record<string, unknown>> = Record<string, Migration & T>;

const keyval = <TKey extends string, TVal>(obj: Record<TKey, TVal>) => {
  return (Object.keys(obj) as TKey[]).map((key) => ({ key, value: obj[key] }));
};

export const countup = (migrations: MigraitonList, counter: number = 0): MigraitonList => {
  return keyval(migrations)
    .reduce((prev, { key, value }) => ({ ...prev, [`${counter++}__${key}`]: value }), {});
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
    .reduce((prev, { key, value: { version: _version, ...rest } }) => ({ ...prev, [key]: rest }), {});
};
