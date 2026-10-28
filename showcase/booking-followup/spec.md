# Showcase Template: Booking & Follow-up

**Category:** Operations / customer experience · **Status:** Idea

## Pitch
New bookings are confirmed instantly, reminders cut no-shows, and happy customers are asked for a review after the job. Nobody has to remember to do any of it.

## Flow (draft)
Booking tool trigger (Calendly or Google Calendar) → validate + dedupe → confirmation email/SMS → create or update CRM contact → Schedule Trigger for reminders (24h and 2h before) → no-show/cancel check → after-visit follow-up with review link → log to data table; failures alert the owner.

## Guardrails
Time zone handling, no duplicate reminders, opt-out respected, quiet hours, review request only after a completed visit, no medical or sensitive details in messages.

## Typical apps
Calendly or Google Calendar, Gmail, SMS provider, CRM or Sheets, Slack.

## Open decisions for design
Which booking tool and SMS provider to demo, reminder timings, review platform link.
