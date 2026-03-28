# 🔍 BMAD Review Protocol
*Adversarial review for Kracked_OS quality and delivery risk*

## When to Use
Trigger when user says:
- `bmad review`
- "review this"
- "check this before shipping"

## Goal
Find bugs, regressions, bad assumptions, maintainability risks, and security concerns before they get expensive.

## Process
1. Inspect the current implementation or proposal
2. Prioritize findings by severity
3. Focus on:
   - behavior regressions
   - broken flows
   - security issues
   - maintainability risks
   - missing validation/testing
4. Keep summaries short after findings
