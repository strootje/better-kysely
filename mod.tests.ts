import { expect } from "@std/expect";
import { parse } from "@std/semver";
import { buildMigrations } from "@strootje/better-kysely";

Deno.test("buildMigrations", async ({ step }) => {
  const migrations = {
    testing: {
      version: parse("1.0.0"),
      up: () => Promise.resolve(),
    },
    something: {
      version: parse("1.2.0"),
      up: () => Promise.resolve(),
    },
  };

  await step("single.entry", () => {
    const result = buildMigrations(({ upto }) => ({
      ...upto(migrations, parse("1.1.0")),
    }));
    expect(Object.keys(result)).toHaveLength(1);
  });

  await step("double.entry.with.and.without.upto", () => {
    const result = buildMigrations(({ upto }) => ({
      ...upto(migrations, parse("1.1.0")),
      ...{ mycustommigration: { async up() {} } },
    }));
    expect(Object.keys(result)).toHaveLength(2);
  });

  await step("double.entry.with.merge.upto", () => {
    const result = buildMigrations(({ upto }) => ({
      ...upto(migrations, parse("1.1.0")),
      ...upto(migrations, parse("1.2.0")),
    }));
    expect(Object.keys(result)).toHaveLength(2);
  });

  await step("double.entry.with.and.without.upto", () => {
    const result = buildMigrations(({ upto }) => ({
      ...upto(migrations, parse("1.1.0")),
      ...{ mycustommigration: { async up() {} } },
      ...upto(migrations, parse("1.2.0")),
    }));
    expect(Object.keys(result)).toHaveLength(3);
  });
});
