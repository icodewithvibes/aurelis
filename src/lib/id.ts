/**
 * UUID utility (Stage 1 shell).
 * All future entities use UUID v4 string ids (02_strategy/04 §sync-ready fields).
 */
import { v4 as uuidv4 } from "uuid";

export function newId(): string {
  return uuidv4();
}
