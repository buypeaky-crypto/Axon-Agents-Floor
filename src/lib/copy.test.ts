import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  editorialTagline,
  houseBody,
  isBrokenCopy,
} from "./copy.ts";

describe("isBrokenCopy", () => {
  it("flags mid-word GitHub cuts", () => {
    assert.equal(isBrokenCopy("AI turns documents into decks—with native shapes, tran."), true);
    assert.equal(isBrokenCopy("Read & search Twitter, Reddit, YouTu."), true);
    assert.equal(isBrokenCopy("Plans tasks, runs tools and skills, self."), true);
    assert.equal(isBrokenCopy("Network specialist. market-research, competitor-analysis."), true);
    assert.equal(isBrokenCopy("Unified ."), true);
  });

  it("keeps finished house sentences", () => {
    assert.equal(isBrokenCopy("A senior reviewer who remembers your house style."), false);
    assert.equal(isBrokenCopy("A field, mapped before lunch."), false);
    assert.equal(isBrokenCopy("Deep research. Sources first. The essay is the byproduct."), false);
  });
});

describe("editorialTagline", () => {
  it("does not ship a fragment", () => {
    const line = editorialTagline("Gyre", "AI turns documents into decks—with native shapes, tran.", "creative");
    assert.equal(isBrokenCopy(line), false);
    assert.match(line, /Gyre|specialist|seat/);
    assert.ok(/[.!?]$/.test(line));
  });
});

describe("houseBody", () => {
  it("finishes the dossier", () => {
    const body = houseBody("Stope", "code", "Ultra-lightweight framework in Python with W.");
    assert.ok(body.length > 80);
    assert.equal(isBrokenCopy(body), false);
    assert.match(body, /adapter pack/);
  });
});
