export enum AccountType {
  USD_PROXY = 'USD_PROXY',
  SOLV = 'SOLV',
  ESCROW = 'ESCROW',
}

export enum LedgerState {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface LedgerEntry {
  id: string;
  xShadowRequestId: string;
  accountType: AccountType;
  accountId: string;
  amount: number;
  state: LedgerState;
  description: string;
  createdAt: Date;
  settledAt?: Date;
}

export interface DoubleEntry {
  debit: LedgerEntry;
  credit: LedgerEntry;
}

export class ShadowLedger {
  private entries: Map<string, LedgerEntry> = new Map();
  private idempotencyCache: Map<string, LedgerEntry> = new Map();
  private readonly ACH_SETTLEMENT_MS = 3 * 24 * 60 * 60 * 1000;

  async createDoubleEntry(
    xShadowRequestId: string,
    fromAccount: { type: AccountType; id: string },
    toAccount: { type: AccountType; id: string },
    amount: number,
    description: string
  ): Promise<DoubleEntry> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const cached = this.idempotencyCache.get(xShadowRequestId);
    if (cached) {
      const debit = this.entries.get(`${xShadowRequestId}-debit`)!;
      const credit = this.entries.get(`${xShadowRequestId}-credit`)!;
      return { debit, credit };
    }

    const now = new Date();
    const debitId = `${xShadowRequestId}-debit`;
    const creditId = `${xShadowRequestId}-credit`;

    const debit: LedgerEntry = {
      id: debitId,
      xShadowRequestId,
      accountType: fromAccount.type,
      accountId: fromAccount.id,
      amount: -amount,
      state: LedgerState.PENDING,
      description,
      createdAt: now,
    };

    const credit: LedgerEntry = {
      id: creditId,
      xShadowRequestId,
      accountType: toAccount.type,
      accountId: toAccount.id,
      amount: amount,
      state: LedgerState.PENDING,
      description,
      createdAt: now,
    };

    this.entries.set(debitId, debit);
    this.entries.set(creditId, credit);
    this.idempotencyCache.set(xShadowRequestId, debit);

    return { debit, credit };
  }

  async settleEntry(xShadowRequestId: string): Promise<LedgerEntry | null> {
    const debit = this.entries.get(`${xShadowRequestId}-debit`);
    if (!debit) return null;

    debit.state = LedgerState.SETTLED;
    debit.settledAt = new Date();

    const credit = this.entries.get(`${xShadowRequestId}-credit`);
    if (credit) {
      credit.state = LedgerState.SETTLED;
      credit.settledAt = new Date();
    }

    return debit;
  }

  async cancelEntry(xShadowRequestId: string): Promise<boolean> {
    const debit = this.entries.get(`${xShadowRequestId}-debit`);
    const credit = this.entries.get(`${xShadowRequestId}-credit`);

    if (!debit || !credit) return false;
    if (debit.state !== LedgerState.PENDING) return false;

    debit.state = LedgerState.CANCELLED;
    credit.state = LedgerState.CANCELLED;

    return true;
  }

  async getAccountBalance(
    accountType: AccountType,
    accountId: string,
    state?: LedgerState
  ): Promise<number> {
    let total = 0;
    for (const entry of this.entries.values()) {
      if (
        entry.accountType === accountType &&
        entry.accountId === accountId &&
        (!state || entry.state === state)
      ) {
        total += entry.amount;
      }
    }
    return total;
  }

  async getAllBalances(): Promise<Map<string, number>> {
    const balances = new Map<string, number>();
    for (const entry of this.entries.values()) {
      const key = `${entry.accountType}:${entry.accountId}`;
      balances.set(key, (balances.get(key) || 0) + entry.amount);
    }
    return balances;
  }

  async verifyLedgerBalances(): Promise<boolean> {
    const balances = await this.getAllBalances();
    let total = 0;
    for (const balance of balances.values()) {
      total += balance;
    }
    return Math.abs(total) < 0.000001;
  }

  async simulateACHSettlement(
    xShadowRequestId: string,
    callback?: (entry: LedgerEntry) => void
  ): Promise<void> {
    const entry = this.entries.get(`${xShadowRequestId}-debit`);
    if (!entry || entry.state !== LedgerState.PENDING) return;

    await new Promise(resolve => setTimeout(resolve, 100));

    await this.settleEntry(xShadowRequestId);
    callback?.(entry);
  }

  getEntriesByRequestId(xShadowRequestId: string): LedgerEntry[] {
    return Array.from(this.entries.values()).filter(
      e => e.xShadowRequestId === xShadowRequestId
    );
  }

  async hasPendingEntries(
    accountType: AccountType,
    accountId: string
  ): Promise<boolean> {
    for (const entry of this.entries.values()) {
      if (
        entry.accountType === accountType &&
        entry.accountId === accountId &&
        entry.state === LedgerState.PENDING
      ) {
        return true;
      }
    }
    return false;
  }

  clear(): void {
    this.entries.clear();
    this.idempotencyCache.clear();
  }
}

export const shadowLedger = new ShadowLedger();
