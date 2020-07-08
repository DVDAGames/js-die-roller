const Roller = require("./index");

// TODO: add more tests for various roll types and add test for a full Roller
// class instance with variables and mapped actions.

test("Rolls dice based on basic notation", () => {
  const roll = new Roller("sum(2d6)");

  expect(roll.result.total).toBeGreaterThanOrEqual(2);
  expect(roll.result.total).toBeLessThanOrEqual(12);
});
