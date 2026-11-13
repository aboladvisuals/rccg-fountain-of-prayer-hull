// Classifies Supabase/PostgREST errors from the department tables so pages can
// show a calm "being set up" message instead of crashing with an error digest.

export type QueryErrorLike = { code?: string | null; message?: string | null } | null | undefined;

/**
 * Error codes meaning the department database objects are missing or not yet
 * exposed to the Data API (e.g. a migration or GRANT still to be applied):
 *  42501     permission denied (missing GRANT; Supabase stopped auto-granting new tables on 30 Oct 2026)
 *  PGRST205  table not found in the schema cache
 *  PGRST202  function not found in the schema cache
 *  42P01     undefined table
 *  42883     undefined function
 *  42703     undefined column (a later migration not applied yet)
 */
const SETUP_CODES = new Set(["42501", "PGRST205", "PGRST202", "42P01", "42883", "42703"]);

export function isDepartmentSetupError(error: QueryErrorLike): boolean {
  return Boolean(error?.code && SETUP_CODES.has(error.code));
}

export type DepartmentsAvailability = "ok" | "setup" | "error";

export function departmentsAvailability(error: QueryErrorLike): DepartmentsAvailability {
  if (!error) return "ok";
  return isDepartmentSetupError(error) ? "setup" : "error";
}

export const DEPARTMENTS_SETUP_MESSAGE =
  "Departments are being set up. Please check back shortly — everything else in the app works as normal.";
export const DEPARTMENTS_ERROR_MESSAGE =
  "Departments couldn’t be loaded just now. Please refresh the page to try again.";

export function departmentsMessage(state: DepartmentsAvailability): string | null {
  if (state === "setup") return DEPARTMENTS_SETUP_MESSAGE;
  if (state === "error") return DEPARTMENTS_ERROR_MESSAGE;
  return null;
}
