import { describe, expect, it } from "vitest";
import {
  SnowflakeIdGenerator,
  createInMemoryCommunityAppSdkPort,
  nextSnowflakeId,
} from "../src";

describe("snowflake id generator", () => {
  it("emits unique decimal string ids", () => {
    const generator = new SnowflakeIdGenerator();
    const ids = new Set<string>();
    for (let index = 0; index < 10_000; index += 1) {
      const id = generator.nextId();
      expect(id).toMatch(/^\d+$/);
      ids.add(id);
    }
    expect(ids.size).toBe(10_000);
  });

  it("emits strictly increasing ids", () => {
    const generator = new SnowflakeIdGenerator();
    let previous = "0";
    for (let index = 0; index < 5_000; index += 1) {
      const id = generator.nextId();
      expect(BigInt(id) > BigInt(previous)).toBe(true);
      previous = id;
    }
  });

  it("encodes timestamp, node and sequence in the canonical layout", () => {
    const epochMillis = 1_700_000_000_000;
    const generator = new SnowflakeIdGenerator({ epochMillis, nodeId: 42 });
    const id = BigInt(generator.nextId());

    // delta = now - epoch; node = 42 (0b101010); sequence starts at 0.
    const delta = id >> 22n;
    const node = (id >> 12n) & 1023n;
    const sequence = id & 4095n;
    const expectedDelta = BigInt(Date.now()) - BigInt(epochMillis);

    expect(node).toBe(42n);
    expect(sequence).toBe(0n);
    // Tolerate the millisecond ticking between generation and assertion.
    expect(expectedDelta - delta).toBeLessThanOrEqual(1n);
    expect(delta).toBeLessThanOrEqual(expectedDelta);
  });

  it("shares one session-wide generator so cross-entity ids stay unique", async () => {
    const portA = createInMemoryCommunityAppSdkPort();
    const portB = createInMemoryCommunityAppSdkPort();
    const ids = new Set<string>();

    ids.add((await portA.community.categories.create({ title: "A" })).id);
    ids.add((await portB.community.categories.create({ title: "B" })).id);
    ids.add(nextSnowflakeId());
    expect(ids.size).toBe(3);
  });

  it("rejects node ids outside the 10-bit range", () => {
    expect(() => new SnowflakeIdGenerator({ nodeId: 1024 })).toThrow(/node id/);
    expect(() => new SnowflakeIdGenerator({ nodeId: -1 })).toThrow(/node id/);
  });

  it("is stable under rapid generation within the same millisecond", () => {
    const generator = new SnowflakeIdGenerator();
    const ids = new Set<string>();
    for (let index = 0; index < 10_000; index += 1) {
      ids.add(generator.nextId());
    }
    // 10k ids span multiple milliseconds; this guards against sequence collisions.
    expect(ids.size).toBe(10_000);
  });

  it("in-memory port creates snowflake ids for every entity type", async () => {
    const port = createInMemoryCommunityAppSdkPort();
    const category = await port.community.categories.create({ title: "Demo" });
    expect(category.id).toMatch(/^\d+$/);

    const entry = await port.community.entries.create({
      categoryId: category.id,
      kind: "discussion",
      title: "Hello",
    });
    expect(entry.id).toMatch(/^\d+$/);

    const comment = await port.community.comments.create(entry.id, { body: "hi" });
    expect(comment.id).toMatch(/^\d+$/);

    const group = await port.community.groups.create(category.id, {
      memberCount: 0,
      name: "官方群",
      platform: "wechat",
    });
    expect(group.id).toMatch(/^\d+$/);

    const tier = await port.community.tiers.create(category.id, {
      durationDays: 365,
      name: "会员",
      price: 99,
    });
    expect(tier.id).toMatch(/^\d+$/);

    const member = await port.community.members.join(category.id);
    expect(member.id).toMatch(/^\d+$/);
    expect(member.user.id).toBe("local-user");
  });
});
