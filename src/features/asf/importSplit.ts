/**
 * ASF import service (Stage 2). Parses ASF text and, only when there are
 * no blocking errors, persists it as the active split. Mirrors the
 * documented flow (03_asf-spec §5): parse → review → save; the guided
 * editor confirms before this is called with a clean program.
 */
import { parseASF, type ParseResult } from "./parse";
import { saveProgramAsActiveSplit } from "../../data/repositories/splitRepo";

export function reviewASF(text: string): ParseResult {
  return parseASF(text);
}

export function hasBlockingErrors(result: ParseResult): boolean {
  return result.issues.some((i) => i.severity === "error");
}

/** Save a reviewed program. Throws if blocking errors remain (guard). */
export async function commitImport(text: string): Promise<string> {
  const result = parseASF(text);
  if (hasBlockingErrors(result)) {
    throw new Error("Cannot import: unresolved errors remain.");
  }
  return saveProgramAsActiveSplit(result.program, text);
}
