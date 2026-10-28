# PLAN.md — Smart POS & KDS

## Phase 0 — Baseline freeze

Status: IN PROGRESS

- [x] Identify academic topic and planned report structure.
- [x] Identify assigned scope: QR ordering + KDS + timer + late warning.
- [x] Record current routes/screens.
- [ ] Inspect actual source files in the repository.
- [ ] Inspect existing `AGENTS.md`, package.json and project scripts.
- [ ] Identify existing API/mock/data layer.
- [ ] Identify current order/timer data structures.
- [ ] Identify whether realtime transport is already implemented.

## Phase 1 — QR Ordering

Goal:
A customer can enter the ordering flow from a table QR context, browse menu, customize supported options, review cart and submit an order.

Tasks:

- [ ] Define QR/table context contract.
- [ ] Confirm mobile layout constraints.
- [ ] Refactor/reuse menu components where appropriate.
- [ ] Implement item customization state.
- [ ] Implement cart state and persistence strategy.
- [ ] Implement order submission adapter.
- [ ] Implement success/pending/error states.
- [ ] Verify mobile viewport behavior.

Acceptance:

- A table context is visible.
- Menu → item → cart → submit is coherent.
- Quantity and notes/customizations are preserved.
- No fake success is shown without confirmed submission.

## Phase 2 — KDS Tablet UI

Goal:
Kitchen staff can see orders grouped by station and act on them.

Tasks:

- [ ] Map current KDS screen to domain states.
- [ ] Define order-card view model.
- [ ] Define station grouping.
- [ ] Define status transitions.
- [ ] Implement tablet responsive layout.
- [ ] Implement completion action.
- [ ] Verify long order lists and overflow behavior.

Acceptance:

- Orders are clearly grouped.
- Time state is immediately readable.
- Completion changes the actual UI/domain state.
- Layout remains usable on tablet dimensions.

## Phase 3 — Timer and late warning

Goal:
Timer is deterministic and derived from timestamps.

Tasks:

- [ ] Confirm target preparation duration source.
- [ ] Define timer utility.
- [ ] Define NORMAL/WARNING/LATE thresholds with team.
- [ ] Implement display formatting.
- [ ] Implement warning/late visual states.
- [ ] Verify timer after tab/background pauses.
- [ ] Verify multiple simultaneous orders.

Acceptance:

- Timer does not drift because of interval counting.
- Refresh/re-render does not reset elapsed time.
- Late state is derived from timestamps.
- Thresholds are documented.

## Phase 4 — Realtime integration

Goal:
Order creation/status changes propagate between customer/POS/KDS.

Tasks:

- [ ] Obtain backend/API contract.
- [ ] Identify existing Socket.IO/SignalR/event mechanism.
- [ ] Define event names and payloads.
- [ ] Implement client adapter.
- [ ] Handle reconnect/disconnect.
- [ ] Verify duplicate/out-of-order events.

Do not start this phase by inventing event names.

## Phase 5 — Academic evidence

For each implemented feature, record:

- requirement,
- design,
- implementation files,
- business rule,
- screenshots,
- test scenario,
- result.

Target report sections:

- 5.2: feature implementation content to be confirmed against the group's final outline.
- 5.3: feature implementation content to be confirmed against the group's final outline.

## Working protocol with Codex

Use one task per prompt.

Good:
"Inspect the current KDS implementation. Do not modify files. Tell me where timer state is calculated, where order status is stored, and which components render the order cards."

Then:
"Implement only the timer utility based on the existing model. Do not change the UI."

Then:
"Add tests for the timer utility."

Avoid:
"Build the whole KDS."

Every completed task should end with:

- changed files,
- behavior changed,
- verification command/result,
- remaining assumptions.
