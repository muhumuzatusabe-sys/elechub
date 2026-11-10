# Architecture

User -> Next.js UI -> API -> Services -> PostgreSQL/Object Storage
                                   |
                                   +-> Redis/BullMQ -> Workers
                                   +-> AI provider
                                   +-> Email provider
                                   +-> SMS provider

Long-running rendering and delivery work belongs in background workers.

Every campaign-owned resource must be authorized against its organization/campaign at the service layer.
