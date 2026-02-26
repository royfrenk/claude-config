# Design Planner File Explosion

**Date:** 2026-02-12
**Problem:** Design Planner created 7 separate files instead of 1 consolidated design spec. Also generated 3 different designs instead of responsive versions of 1 design.
**Triggered by:** User feedback during sprint work.

## What Failed
- Design Planner had no constraints on output format
- Created multiple files that were hard to track and reference

## Fix Applied
- Added CRITICAL instruction to design-planner.md: "Create ONE consolidated design-spec.md file. Do NOT create multiple files."
- Added output format constraints

## Principle
**Add explicit constraints to agent output format.** When an agent produces artifacts (files, specs, reports), specify exactly how many files, what naming convention, and what structure. Don't leave it open-ended.

## Outcome
Fix worked — Design Planner now creates single files consistently.
