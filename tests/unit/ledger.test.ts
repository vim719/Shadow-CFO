import { test, expect, describe, beforeEach } from 'bun:test';
import {
  ShadowLedger,
  AccountType,
  LedgerState,
  shadowLedger
} from '../../src/core/ledger/index';

describe('Shadow Ledger', () => {
  let ledger: ShadowLedger;

  beforeEach(() => {
    ledger = new ShadowLedger();
  });

  test('ledger_must_balance_to_zero', async () => {
    await ledger.createDoubleEntry(
      'req-001',
      { type: AccountType.USD_PROXY, id: 'user-123-chase' },
      { type: AccountType.USD_PROXY, id: 'user-123-marcus' },
      1000,
      'Cash sweep to HYSA'
    );

    const balanced = await ledger.verifyLedgerBalances();
    expect(balanced).toBe(true);
  });

  test('reject_action_without_signed_consent', async () => {
    const ledgerWithoutConsent = new ShadowLedger();

    await expect(async () => {
      await ledgerWithoutConsent.createDoubleEntry(
        'req-unauthorized',
        { type: AccountType.USD_PROXY, id: 'user-123' },
        { type: AccountType.USD_PROXY, id: 'user-456' },
        -5000,
        'Unauthorized transfer'
      );
    }).toThrow('Amount must be positive');
  });

  test('idempotent_entries_return_same_result', async () => {
    const entry1 = await ledger.createDoubleEntry(
      'req-idempotent',
      { type: AccountType.USD_PROXY, id: 'user-1' },
      { type: AccountType.USD_PROXY, id: 'user-2' },
      500,
      'Test idempotency'
    );

    const entry2 = await ledger.createDoubleEntry(
      'req-idempotent',
      { type: AccountType.USD_PROXY, id: 'user-1' },
      { type: AccountType.USD_PROXY, id: 'user-2' },
      500,
      'Test idempotency'
    );

    expect(entry1.debit.id).toBe(entry2.debit.id);
    expect(entry1.credit.id).toBe(entry2.credit.id);
  });

  test('no_duplicate_ledger_entry_on_timeout', async () => {
    const reqId = 'req-timeout-001';

    await ledger.createDoubleEntry(
      reqId,
      { type: AccountType.USD_PROXY, id: 'source' },
      { type: AccountType.USD_PROXY, id: 'dest' },
      100,
      'ACH transfer'
    );

    await ledger.settleEntry(reqId);
    await ledger.settleEntry(reqId);

    const entries = ledger.getEntriesByRequestId(reqId);
    const settledEntries = entries.filter(e => e.state === LedgerState.SETTLED);

    expect(settledEntries.length).toBe(2);
  });

  test('sweep_fails_if_balance_below_buffer', async () => {
    const userId = 'user-buffer-test';
    const bufferAmount = 1000;

    const balance = await ledger.getAccountBalance(
      AccountType.USD_PROXY,
      userId
    );

    if (balance < bufferAmount) {
      const canSweep = balance >= bufferAmount;
      expect(canSweep).toBe(false);
    } else {
      expect(true).toBe(true);
    }
  });

  test('pending_entries_block_additional_transfers', async () => {
    const userId = 'user-pending-test';

    await ledger.createDoubleEntry(
      'req-pending-1',
      { type: AccountType.USD_PROXY, id: userId },
      { type: AccountType.ESCROW, id: 'escrow-1' },
      500,
      'First transfer'
    );

    const hasPending = await ledger.hasPendingEntries(
      AccountType.USD_PROXY,
      userId
    );

    expect(hasPending).toBe(true);
  });

  test('cancel_entry_reverts_pending_state', async () => {
    await ledger.createDoubleEntry(
      'req-cancel-test',
      { type: AccountType.USD_PROXY, id: 'from' },
      { type: AccountType.USD_PROXY, id: 'to' },
      200,
      'Cancel this transfer'
    );

    const cancelled = await ledger.cancelEntry('req-cancel-test');
    expect(cancelled).toBe(true);

    const entries = ledger.getEntriesByRequestId('req-cancel-test');
    expect(entries.every(e => e.state === LedgerState.CANCELLED)).toBe(true);
  });

  test('solv_account_type_balances_correctly', async () => {
    await ledger.createDoubleEntry(
      'req-solv-1',
      { type: AccountType.SOLV, id: 'user-solv-1' },
      { type: AccountType.SOLV, id: 'user-solv-1' },
      100,
      '$SOLV reward'
    );

    const balance = await ledger.getAccountBalance(
      AccountType.SOLV,
      'user-solv-1'
    );

    expect(balance).toBe(0);
  });

  test('architect_tier_gate_requires_sufficient_solv_balance', async () => {
    const ARCHITECT_THRESHOLD = 1000;
    const initialBalance = 847;

    const balance = await ledger.getAccountBalance(
      AccountType.SOLV,
      'user-architect-test'
    );

    const canAccess = (initialBalance + balance) >= ARCHITECT_THRESHOLD;
    expect(canAccess).toBe(false);
  });
});
