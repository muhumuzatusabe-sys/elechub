# Messaging

Create EmailProvider and SmsProvider interfaces with vendor-specific adapters.

Controls:
authorized recipient source, opt-out suppression, rate limiting, provider response logging, retries, idempotency, scheduling and approval.

Never expose credentials client-side and never report delivery until confirmed by provider status.
