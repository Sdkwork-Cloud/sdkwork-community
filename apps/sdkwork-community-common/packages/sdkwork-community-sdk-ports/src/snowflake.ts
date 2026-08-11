/**
 * Snowflake (雪花) ID generation for the Community in-memory App SDK port.
 *
 * Mirrors the canonical SDKWork snowflake layout from `sdkwork-id-core`
 * (`crates/sdkwork-id-core/src/snowflake.rs`):
 *
 * - 41 bits: timestamp delta in milliseconds since epoch (2024-01-01T00:00:00Z)
 * - 10 bits: node id (0-1023)
 * - 12 bits: per-millisecond sequence (0-4095)
 * - layout: `(delta << 22) | (node << 12) | sequence`
 *
 * IDs exceed `Number.MAX_SAFE_INTEGER`, so they are computed with `BigInt` and
 * returned as decimal strings — matching the `id: string` contract of the
 * community data models.
 *
 * All entity IDs created by the in-memory port (circles, posts, comments,
 * groups, tiers, memberships) and the seeded demo circles go through the
 * module-level singleton generator so IDs stay unique within the session.
 */

const DEFAULT_EPOCH_MILLIS = 1_704_067_200_000; // 2024-01-01T00:00:00Z

const TIMESTAMP_BITS = 41n;
const NODE_BITS = 10n;
const SEQUENCE_BITS = 12n;

const MAX_NODE_ID = (1n << NODE_BITS) - 1n;
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n;

const NODE_SHIFT = SEQUENCE_BITS;
const TIMESTAMP_SHIFT = NODE_BITS + SEQUENCE_BITS;

export interface SnowflakeIdGeneratorOptions {
  /** 10-bit node id (0-1023). Defaults to 0, matching the server fallback. */
  nodeId?: number;
  /** Custom epoch in milliseconds since the Unix epoch. */
  epochMillis?: number;
}

export class SnowflakeIdGenerator {
  private readonly nodeId: bigint;
  private readonly epochMillis: bigint;
  private lastDelta = -1n;
  private sequence = 0n;

  constructor(options: SnowflakeIdGeneratorOptions = {}) {
    const nodeId = BigInt(options.nodeId ?? 0);
    if (nodeId < 0n || nodeId > MAX_NODE_ID) {
      throw new Error(`snowflake node id must be in [0, ${MAX_NODE_ID}], got ${options.nodeId}`);
    }
    const epochMillis = BigInt(options.epochMillis ?? DEFAULT_EPOCH_MILLIS);
    if (epochMillis < 0n) {
      throw new Error(`snowflake epoch must be non-negative, got ${options.epochMillis}`);
    }
    this.nodeId = nodeId;
    this.epochMillis = epochMillis;
  }

  /** Returns the next snowflake ID as a decimal string. */
  nextId(): string {
    const now = BigInt(Date.now()) - this.epochMillis;
    if (now < 0n) {
      throw new Error(`snowflake clock before epoch: delta=${now}`);
    }

    // Clock rollback: keep the last logical timestamp so IDs stay monotonic.
    let delta = now < this.lastDelta ? this.lastDelta : now;

    if (delta === this.lastDelta) {
      this.sequence = (this.sequence + 1n) & MAX_SEQUENCE;
      if (this.sequence === 0n) {
        // 4096 IDs exhausted within one millisecond.
        if (now < this.lastDelta) {
          // Clock rolled back: advance logical time instead of waiting on a
          // clock that may never catch up.
          delta = this.lastDelta + 1n;
        } else {
          delta = this.waitNextDelta(this.lastDelta);
        }
      }
    } else {
      this.sequence = 0n;
    }

    this.lastDelta = delta;
    return String(
      (delta << TIMESTAMP_SHIFT) | (this.nodeId << NODE_SHIFT) | this.sequence,
    );
  }

  private waitNextDelta(lastDelta: bigint): bigint {
    let delta = BigInt(Date.now()) - this.epochMillis;
    while (delta <= lastDelta) {
      delta = BigInt(Date.now()) - this.epochMillis;
    }
    return delta;
  }
}

let defaultGenerator: SnowflakeIdGenerator | null = null;

/** Shared session-wide snowflake generator (node 0). */
export function nextSnowflakeId(): string {
  defaultGenerator ??= new SnowflakeIdGenerator();
  return defaultGenerator.nextId();
}
