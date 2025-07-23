import { expect } from "@std/expect";
import { buildMigrations } from "./mod.ts";

Deno.test("buildMigrations", async ({ step }) => {
  const migrations = {
    testing: {
      version: "1.0.0",
      up: () => Promise.resolve(),
    },
    something: {
      version: "1.2.0",
      up: () => Promise.resolve(),
    },
  } as const;

  await step("single.entry", () => {
    const result = buildMigrations(({ upto }) => ({
      ...upto(migrations, "1.0.0"),
    }));
    expect(Object.keys(result)).toHaveLength(1);
  });

  await step("double.entry.with.and.without.upto", () => {
    const result = buildMigrations(({ upto }) => ({
      ...upto(migrations, "1.0.0"),
      ...{ mycustommigration: { async up() {} } },
    }));
    expect(Object.keys(result)).toHaveLength(2);
  });

  await step("double.entry.with.merge.upto", () => {
    const result = buildMigrations(({ upto }) => ({
      ...upto(migrations, "1.0.0"),
      ...upto(migrations, "1.2.0"),
    }));
    expect(Object.keys(result)).toHaveLength(2);
  });

  await step("double.entry.with.and.without.upto", () => {
    const result = buildMigrations(({ upto }) => ({
      ...upto(migrations, "1.0.0"),
      ...{ mycustommigration: { async up() {} } },
      ...upto(migrations, "1.2.0"),
    }));
    expect(Object.keys(result)).toHaveLength(3);
  });
});
