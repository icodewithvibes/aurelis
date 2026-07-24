/**
 * Vitest setup: jest-dom matchers + a fake IndexedDB so the Dexie
 * shell can open under jsdom. No real persistence is exercised.
 */
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
