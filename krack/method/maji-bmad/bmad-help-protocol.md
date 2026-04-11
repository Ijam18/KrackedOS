# 🧭 BMAD Help Protocol
*Phase-aware next-step routing for Kracked_OS*

## When to Use
Trigger when user says:
- `bmad help`
- "what should we do next?"
- "what do you recommend next for Kracked_OS?"

## Goal
Return the **best next step** for the current state of Kracked_OS instead of generic suggestions.

## Process
1. Review current session memory and relationship memory
2. Identify the current Kracked_OS phase using `kracked-os-phase-guide.md`
3. Check current repo truth before trusting memory
4. Recommend:
   - one immediate next step
   - one optional supporting step
   - one caution/risk if relevant
