# Pattern Library: E-commerce / Support

| Pattern | Flow | Key safeguards |
|---|---|---|
| Order-to-support | New/updated order → check status/risk → create or update helpdesk contact → notify team on exceptions → proactive customer message | Duplicate-order guard, PII minimization |
| Ticket triage | New ticket → LLM classifies (intent, urgency, sentiment) → route/assign → draft reply for agent approval | Review for refunds/legal/angry-customer, confidence threshold |
| Order status deflection | Customer asks "where is my order" → look up order/tracking → templated reply | Verify identity (order number + email) before disclosing |
| Refund/return flow | Request → policy check → approval step → refund action → customer confirmation | Hard approval gate on money movement, audit log |
| Inventory alerts | Scheduled stock check → low-stock digest → draft purchase request | Thresholds in config, not hard-coded |
| Review requests | Delivered order → Wait node delay → request review → route low ratings to owner | Respect marketing consent |
