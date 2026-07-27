# ADR-004: Posted Business Facts Are Immutable

## Status

Accepted

## Context

`docs/analysis/01-document-analysis.md` (Section 1, "Executive Summary") states that "a posted transaction is the official business event... Posted transactions are not deleted or silently edited; corrections use returns, cancellation, reversal, reallocation, or authorized adjustments" [BRD §5 — "Core Business Principles"] [BRD Appendix B — "Business Impact Matrix for Transactions"] [SRS §5 — "Cross-Cutting Functional Rules"]. This principle recurs throughout the analysis: Section 6.1, "Global Posting Rules," states that "posted facts are not deleted or silently edited," and that "every reversal preserves and links the original record; cancelled numbers are not reused."

`docs/business/invariants.md` ("Global Invariants") restates this as a confirmed business truth: posted facts are not deleted or silently edited, corrections happen only through a return, cancellation, reversal, reallocation, or an authorized adjustment, and a reversal always preserves and links back to the original record.

This principle exists because TOPTANFLOW's core business problem, per the analysis (Section 1), is keeping four operational positions — physical/recorded inventory, cash by account, receivables/payables by partner and document, and transaction/correction history — synchronized and explainable at all times. An audit history that could be altered after the fact (`docs/business/invariants.md`, "Audit": "the audit history is append-only; no user may edit or delete it") would make every other invariant unverifiable, since there would be no reliable record of what actually happened.

The BRD and the workflow definitions in `docs/business/workflow-map.md` describe several distinct, named mechanisms for correcting a mistake after posting — a return (Sales Return, Purchase Return), a cancellation (Sale Cancellation, Purchase Cancellation), a reversal (Correction and Reversal), a reallocation (within Settlement), or an approved adjustment (Stock Count and Adjustment, Cash Closing) — rather than a single generic "edit" or "delete" capability.

## Decision

Once a business transaction is posted, the facts it recorded (its inventory effect, cash effect, receivable/payable effect, cost snapshot, and audit entry) are immutable. They are never edited in place and never deleted.

Any correction to a posted business fact must be made through one of the following, already-defined mechanisms, and no other:

- **Return** — for goods physically returned against an original sale or purchase (see `docs/business/workflow-map.md`, "Sales Return," "Purchase Return," "Yatı Return").
- **Cancellation** — for voiding an entire posted document that should not have existed, while preserving its number and creating the exact opposite effect (see "Sale Cancellation," "Purchase Cancellation").
- **Reversal** — for compensating a posted transaction with an equal and opposite transaction that remains linked to the original (see "Correction and Reversal").
- **Reallocation** — for changing which document(s) a payment was applied to, without altering the underlying payment or sale/purchase records themselves.
- **Authorized adjustment** — for approved corrections identified through a controlled process such as a stock count or cash closing, always carrying a reason and, above a threshold, approval.

Every one of these mechanisms creates a new, linked record rather than altering history, and every one of them is itself captured in the audit history.

## Consequences

- At any point in time, the full history of what happened — including mistakes and their corrections — remains available and trustworthy, satisfying the audit invariant that the audit history is append-only.
- A cancelled or reversed document's identifying number is never reused, preventing ambiguity about which record a later reference points to.
- Every correction is explainable: it always references the original record it corrects, and the reason for the correction is preserved.
- This decision necessarily disallows any feature or shortcut that would "just edit" or "just delete" a posted record, even for convenience, even under time pressure, and even when a human explicitly requests it outside one of the defined mechanisms — per `AGENTS.md`, such a request must be treated as a Stop Condition rather than fulfilled directly.
- Any new workflow introduced in the future that produces a posted business fact must, from the outset, define which of these correction mechanisms applies to it; a workflow with no defined correction path is incomplete.

## Alternatives Considered

- **Allowing direct edits to a posted document with an audit trail of the change:** Rejected. Even with an audit trail, allowing the "current" version of a posted document to change would break the invariant that a posted fact is authoritative and stable at the moment it occurred, and would complicate every downstream calculation (inventory balances, cost snapshots, receivable/payable balances) that assumes posted history never moves.
- **Allowing deletion of clearly erroneous posted documents (e.g., duplicate or test postings) instead of cancellation:** Rejected. `docs/business/invariants.md` is explicit that a cancelled document's number is never reused and that the original is retained and marked cancelled; deletion would remove the evidence needed to explain why a correction occurred, violating the audit invariant that the audit history is append-only.
- **A single generic "correction" action covering all cases instead of distinct return/cancellation/reversal/reallocation/adjustment mechanisms:** Rejected. The BRD and `docs/business/workflow-map.md` define these as distinct business events with different preconditions and effects (e.g., a return implies goods physically move, a cancellation implies the whole document was wrong, a reallocation only changes settlement). Collapsing them into one generic mechanism would lose this business meaning and make the correction itself harder to audit and explain.
