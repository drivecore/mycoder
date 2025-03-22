//import Anthropic from '@anthropic-ai/sdk';

import { LogLevel } from '../utils/logger.js';

const PER_MILLION = 1 / 1000000;
const TOKEN_COST = {
  input: 3 * PER_MILLION,
  cacheWrites: 3.75 * PER_MILLION,
  cacheReads: 0.3 * PER_MILLION,
  output: 15 * PER_MILLION,
};

export class TokenUsage {
  public input: number = 0;
  public cacheWrites: number = 0;
  public cacheReads: number = 0;
  public output: number = 0;

  constructor() {}

  add(usage: TokenUsage) {
    this.input += usage.input;
    this.cacheWrites += usage.cacheWrites;
    this.cacheReads += usage.cacheReads;
    this.output += usage.output;
  }

  clone() {
    const usage = new TokenUsage();
    usage.input = this.input;
    usage.cacheWrites = this.cacheWrites;
    usage.cacheReads = this.cacheReads;
    usage.output = this.output;
    return usage;
  }

  /*
  static fromMessage(message: Anthropic.Message) {
    const usage = new TokenUsage();
    usage.input = message.usage.input_tokens;
    usage.cacheWrites = message.usage.cache_creation_input_tokens ?? 0;
    usage.cacheReads = message.usage.cache_read_input_tokens ?? 0;
    usage.output = message.usage.output_tokens;
    return usage;
  }*/

  static sum(usages: TokenUsage[]) {
    const usage = new TokenUsage();
    usages.forEach((u) => usage.add(u));
    return usage;
  }

  getCost() {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

    return formatter.format(
      this.input * TOKEN_COST.input +
        this.cacheWrites * TOKEN_COST.cacheWrites +
        this.cacheReads * TOKEN_COST.cacheReads +
        this.output * TOKEN_COST.output,
    );
  }

  toString() {
    return `input: ${this.input} cache-writes: ${this.cacheWrites} cache-reads: ${this.cacheReads} output: ${this.output} COST: ${this.getCost()}`;
  }
}

export class TokenTracker {
  public tokenUsage = new TokenUsage();
  public children: TokenTracker[] = [];

  constructor(
    public readonly name: string = 'unnamed',
    public readonly parent: TokenTracker | undefined = undefined,
    public readonly logLevel: LogLevel = parent?.logLevel ?? LogLevel.debug,
  ) {
    if (parent) {
      parent.children.push(this);
    }
  }

  getTotalUsage() {
    const usage = this.tokenUsage.clone();
    this.children.forEach((child) => usage.add(child.getTotalUsage()));
    return usage;
  }

  getTotalCost() {
    const usage = this.getTotalUsage();
    return usage.getCost();
  }

  toString() {
    return `${this.name}: ${this.getTotalUsage().toString()}`;
  }
}
