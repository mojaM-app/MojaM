import { toNumber } from '@utils';
import { DbConnectionManager } from '../dbConnectionManager';
import type { DbContext } from '../dbContext';

type TDbError = { code?: string; message?: string } | undefined;

interface IRelatedDataRow {
  count: string | number | null | undefined;
  entities: string;
}

export abstract class BaseRepository {
  protected readonly _dbContext: DbContext;

  constructor() {
    this._dbContext = DbConnectionManager.getDbContext();
  }

  protected isUniqueConstraintError(err: unknown, constraintName: string): boolean {
    const dbErr = this.getDbError(err);

    if (dbErr === undefined) {
      return false;
    }

    const isDuplicateCode =
      dbErr.code === 'ER_DUP_ENTRY' || dbErr.code === 'SQLITE_CONSTRAINT_UNIQUE' || dbErr.code === '23505';
    const hasConstraintInMessage = dbErr.message?.includes(constraintName) ?? false;
    return isDuplicateCode || hasConstraintInMessage;
  }

  protected mapRelatedDataRows(rows: IRelatedDataRow[]): string[] {
    return rows
      .map(row => ({ count: toNumber(row.count ?? 0), entities: row.entities }))
      .filter(item => (item.count ?? 0) > 0)
      .map(item => item.entities);
  }

  private getDbError(err: unknown): TDbError {
    if (typeof err !== 'object' || err === null) {
      return undefined;
    }
    const raw = err as { code?: unknown; message?: unknown };
    const code = typeof raw.code === 'string' ? raw.code : undefined;
    const message = typeof raw.message === 'string' ? raw.message : undefined;
    return { code, message };
  }
}
