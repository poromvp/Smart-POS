# AGENTS.md — Smart POS & KDS

## Project identity

This repository is the implementation of the specialized-project topic:

**Smart POS & KDS — Hệ thống Quản lý Chuỗi Nhà hàng, Gọi món Không chạm & Điều phối Bếp Thông minh**

Core flow:

QR tại bàn → khách xem menu/chọn món → tạo order → order được điều phối tới KDS → bếp xử lý theo thời gian thực → timer/cảnh báo món trễ → hoàn thành → POS/thanh toán → dữ liệu kho/BOM.

The academic outline describes the system at a proposal level. Do not invent requirements that are not supported by the project documents or an explicitly approved team decision.

## Current implementation baseline

The current frontend already contains routes/screens corresponding to:

- `/login`
- `/menu`
- `/cart`
- `/kds`
- `/pos`
- `/admin`
- `/order-taking`

The current UI baseline includes:

- Customer menu and cart flow.
- KDS dashboard with kitchen stations, order cards, elapsed/remaining time, status labels and a "Hoàn thành" action.
- POS screen with table map, current order and payment action.
- Login screen with role-oriented demo accounts.
- Admin placeholder/dashboard.
- Order-taking placeholder/dashboard.

Treat the existing UI and behavior as the baseline. Prefer incremental modification over rewriting.

## Primary responsibility for Nguyễn Hoàng Lập

The assigned scope is:

1. Mobile UI for QR ordering.
2. Tablet UI for KDS.
3. Timer logic for kitchen orders.
4. Visual warning when an order/item is late.
5. Sections 5.2 and 5.3 of the report, according to the team's agreed outline.

Do not silently take ownership of unrelated modules.

## AI/Codex working rules

Before changing code:

1. Inspect the relevant existing files.
2. Identify the current data model/state flow.
3. Identify existing components/utilities before creating new ones.
4. Check whether the backend/API contract already exists.
5. State the files you intend to change.
6. Make the smallest coherent change.

After changing code:

1. Run the relevant typecheck/lint/build/test command available in the repository.
2. Report what changed.
3. Report verification results.
4. Explicitly report unresolved assumptions or API dependencies.

## Architecture rules

- Do not invent API endpoints, DTOs, database fields, Socket.IO events, or authentication rules when they have not been agreed.
- If the backend contract is missing, use a clearly isolated mock/adapter rather than scattering fake data throughout UI components.
- Keep timer calculations deterministic and based on timestamps/durations, not on repeated state increments.
- Separate presentation from timer/state logic where practical.
- Preserve existing route structure and styling unless the task explicitly asks for a redesign.
- Do not modify another member's module merely to make the local implementation convenient.

## KDS timer rules

The KDS timer should conceptually derive from:

`elapsed = now - startedAt`

and, when a target preparation duration exists:

`remaining = targetDuration - elapsed`

State should be derived from the timestamps:

- NORMAL: elapsed < targetDuration \* warning threshold
- WARNING: approaching/exceeding the warning threshold
- LATE: elapsed > targetDuration

The exact warning threshold must be confirmed from the team's requirements before hard-coding it.

Do not use `setInterval` to increment elapsed time as the source of truth.

## UI rules

Customer QR ordering:

- Mobile-first.
- Clear restaurant/table context.
- Fast category/menu browsing.
- Item customization where supported.
- Cart review before order submission.
- Clear order submission state.
- Do not claim payment/order success until the actual application state confirms it.

KDS:

- Tablet-first.
- High information density but readable from kitchen distance.
- Clear station grouping.
- Order ID, items, notes, quantity and time must be visually distinguishable.
- Normal/warning/late states must be immediately recognizable.
- "Hoàn thành" must be a deliberate state transition, not merely a visual toggle.

## Academic/report rules

The project is an academic specialized project. Implementation decisions should be explainable in:

- requirements analysis,
- system design,
- implementation,
- results/evaluation.

When a feature is implemented, keep enough information to later explain:

- why it exists,
- its input/output,
- relevant business rule,
- affected components,
- verification method.

## Safety against AI drift

Never:

- rewrite the whole project without approval,
- delete working features to simplify a task,
- replace the stack,
- introduce a new state-management framework unnecessarily,
- fabricate backend behavior,
- fabricate test results,
- say a feature is "realtime" when it is only local polling/mock state.

When requirements conflict, stop at the smallest ambiguity and ask for the decision.
