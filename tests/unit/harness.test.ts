import { test, expect, describe } from 'bun:test';
import {
  evaluateRunway,
  evolveHarness,
  CHURN_RULE,
  type HarnessConfig,
} from '../../src/routes/harness/analyze';

describe('Recursive Harness', () => {
  const baseHarness: HarnessConfig = {
    key: 'default',
    version: 1,
    rules: ['Compute runway as cash balance divided by monthly burn rate.'],
    guardrails: { max_unsupported_assumptions: 0 },
    active_tools: ['calculate_runway'],
    evolution_history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test('flags violation when renewal rule is missing', () => {
    const { result, unsupportedAssumptions } = evaluateRunway(baseHarness);

    expect(result.accountedForRenewal).toBe(false);
    expect(unsupportedAssumptions).toBe(1);
    expect(result.runwayMonths).toBe(8);
    expect(result.note).toContain('overstated');
  });

  test('honors rule when renewal rule is present', () => {
    const harness: HarnessConfig = {
      ...baseHarness,
      rules: [...baseHarness.rules, CHURN_RULE],
    };

    const { result, unsupportedAssumptions } = evaluateRunway(harness);

    expect(result.accountedForRenewal).toBe(true);
    expect(unsupportedAssumptions).toBe(0);
    expect(result.runwayMonths).toBe(6);
    expect(result.note).toContain('Includes');
  });

  test('evolveHarness bumps version and appends rule', () => {
    const updated = evolveHarness(
      baseHarness,
      CHURN_RULE,
      'Runway projection ignored a known upcoming recurring cost'
    );

    expect(updated.version).toBe(2);
    expect(updated.rules).toContain(CHURN_RULE);
    expect(updated.evolution_history).toHaveLength(1);
    expect(updated.evolution_history[0]!.addedRule).toBe(CHURN_RULE);
    expect(updated.evolution_history[0]!.previousVersion).toBe(1);
  });

  test('evolveHarness does not duplicate an existing rule', () => {
    const harness: HarnessConfig = {
      ...baseHarness,
      rules: [...baseHarness.rules, CHURN_RULE],
    };

    const updated = evolveHarness(
      harness,
      CHURN_RULE,
      'Runway projection ignored a known upcoming recurring cost'
    );

    expect(updated.rules.filter((r) => r === CHURN_RULE)).toHaveLength(1);
    expect(updated.evolution_history).toHaveLength(1);
  });

  test('evolveHarness appends a new history entry each time', () => {
    const first = evolveHarness(baseHarness, CHURN_RULE, 'First reason');
    const second = evolveHarness(first, 'Second rule', 'Second reason');

    expect(second.version).toBe(3);
    expect(second.evolution_history).toHaveLength(2);
    expect(second.rules).toContain('Second rule');
  });
});
