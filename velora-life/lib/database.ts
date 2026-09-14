import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { openDatabase } from '../scripts/database.mjs';
const state = globalThis as typeof globalThis & {
  veloraDatabase?: DatabaseSync;
};
function connection(): DatabaseSync {
  return (state.veloraDatabase ??= openDatabase());
}
class Statement {
  constructor(
    readonly sql: string,
    readonly args: SQLInputValue[] = [],
  ) {}
  bind(...args: SQLInputValue[]) {
    return new Statement(this.sql, args);
  }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    return (
      (connection()
        .prepare(this.sql)
        .get(...this.args) as T) ?? null
    );
  }
  async all<T = Record<string, unknown>>(): Promise<{
    results: T[];
  }> {
    return {
      results: connection()
        .prepare(this.sql)
        .all(...this.args) as T[],
    };
  }
  execute() {
    const result = connection()
      .prepare(this.sql)
      .run(...this.args);
    return {
      meta: {
        changes: Number(result.changes),
        last_row_id: Number(result.lastInsertRowid),
      },
    };
  }
  async run() {
    return this.execute();
  }
}
const db = {
  prepare(sql: string) {
    return new Statement(sql);
  },
  async batch(statements: Statement[]) {
    const connectionDb = connection();
    connectionDb.exec('BEGIN IMMEDIATE');
    try {
      const results = statements.map((statement) => statement.execute());
      connectionDb.exec('COMMIT');
      return results;
    } catch (error) {
      connectionDb.exec('ROLLBACK');
      throw error;
    }
  },
};
export function database() {
  return db;
}
