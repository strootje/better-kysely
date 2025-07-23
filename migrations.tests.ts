import { expect } from "@std/expect";
import * as util from "./migrations.ts";

Deno.test("build should be empty with no migrations", () => {
  // Arrange
  const migrations = util.build({
    core: {},
  });

  // Act
  const result = migrations();

  // Assert
  expect(Object.keys(result)).toHaveLength(0);
});

Deno.test("build should have 1 migration", () => {
  // Arrange
  const migrations = util.build({
    core: {
      the_first: { version: "1.2.3", async up() {} },
    },
  });

  // Act
  const result = migrations();

  // Assert
  expect(Object.keys(result)).toHaveLength(1);
});

Deno.test("build should have 1 migration if module is not selected", () => {
  // Arrange
  const migrations = util.build({
    core: {
      the_first: { version: "1.2.3", async up() {} },
    },

    module: {
      this_second: { version: "1.2.3", async up() {} },
    },
  });

  // Act
  const result = migrations();

  // Assert
  expect(Object.keys(result)).toHaveLength(1);
});

Deno.test("build should have 2 migration if module is selected", () => {
  // Arrange
  const migrations = util.build({
    core: {
      the_first: { version: "1.2.3", async up() {} },
    },

    module: {
      this_second: { version: "1.2.3", async up() {} },
    },
  });

  // Act
  const result = migrations("module");

  // Assert
  expect(Object.keys(result)).toHaveLength(2);
});

Deno.test("build should have 2 migration if module is selected", () => {
  // Arrange
  const migrations = util.build({
    core: {
      the_first: { version: "1.2.3", async up() {} },
      the_second: { version: "1.2.4", async up() {} },
    },

    module: {
      this_first_plugin: { version: "1.2.3", async up() {} },
      the_second_plugin: { version: "1.2.4", async up() {} },
    },
  });

  // Act
  const result = migrations("module");

  // Assert
  expect(Object.keys(result)).toHaveLength(4);
});

const migrations = util.build({
  core: {
    the_first: { version: "1.0.0", async up() {} },
    the_second: { version: "1.1.0", async up() {} },
  },

  plugin: {
    the_first_plugin: { version: "1.0.0", async up() {} },
    the_second_plugin: { version: "1.1.0", async up() {} },
  },
});

Deno.test("pin should return 1 migration if the version is not the latest", () => {
  // Arrange
  const input = migrations();

  // Act
  const result = util.pin(input, "1.0.0");

  // Assert
  expect(Object.keys(result)).toHaveLength(1);
  expect(result).toHaveProperty("the_first");
});

Deno.test("pin should return 2 migration if the version is  the latest", () => {
  // Arrange
  const input = migrations();

  // Act
  const result = util.pin(input, "1.1.0");

  // Assert
  expect(Object.keys(result)).toHaveLength(2);
  expect(result).toHaveProperty("the_first");
  expect(result).toHaveProperty("the_second");
});

Deno.test("dedupe should ignore keys it's already seen", () => {
  // Arrange
  const input = {
    ...util.pin(migrations(), "1.0.0"),
    ...util.pin(migrations(), "1.1.0"),
  };

  // Act
  const result = util.dedupe(input);

  // Assert
  expect(Object.keys(result)).toHaveLength(2);
  expect(result).toHaveProperty("the_first");
  expect(result).toHaveProperty("the_second");
});

Deno.test("countup should add ordered numbering to the keys", () => {
  // Arrange
  const input = util.dedupe({
    ...util.pin(migrations(), "1.1.0"),
  });

  // Act
  const result = util.countup(input);

  // Assert
  expect(Object.keys(result)).toHaveLength(2);
  expect(result).toHaveProperty("00001__the_first");
  expect(result).toHaveProperty("00002__the_second");
});

Deno.test("countup should order based on version, then based on plugin", () => {
  // Arrange
  const input = util.dedupe({
    ...util.pin(migrations("plugin"), "1.1.0"),
  });

  // Act
  const result = util.countup(input);

  // Assert
  expect(Object.keys(result)).toHaveLength(4);
  expect(result).toHaveProperty("00001__the_first");
  expect(result).toHaveProperty("00002__the_first_plugin");
  expect(result).toHaveProperty("00003__the_second");
  expect(result).toHaveProperty("00004__the_second_plugin");
});
