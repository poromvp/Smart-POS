# AI_WORKFLOW.md

## Recommended loop

### 1. Ask AI to inspect

Do not immediately ask Codex to code.

Example:

> Inspect the existing QR ordering and KDS code. Do not modify anything. Identify the relevant pages, components, state, data models, API calls and timer logic. Return a concise dependency map.

### 2. Ask AI to plan one slice

Example:

> Based only on the existing implementation and AGENTS.md, propose the smallest implementation plan for KDS timer + late warning. Do not code yet. List files to change and assumptions.

### 3. Implement

Example:

> Implement only step 1 of the approved plan. Preserve the existing UI. Do not invent backend contracts. After editing, run the relevant checks.

### 4. Verify

Ask:

> Review the diff for regressions against AGENTS.md. Run the relevant typecheck/lint/test/build commands and report exact results.

### 5. Commit small changes

Recommended commit units:

- `feat(qr): ...`
- `feat(kds): ...`
- `feat(kds-timer): ...`
- `fix(kds): ...`
- `test(kds): ...`
- `docs: ...`

## Golden rule

AI should be used as:

- codebase navigator,
- implementation assistant,
- test generator,
- reviewer,
- documentation assistant.

The team remains responsible for:

- requirements,
- architecture decisions,
- API contracts,
- business rules,
- final verification,
- academic explanation.
