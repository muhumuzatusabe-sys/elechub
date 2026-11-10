# Acceptance Tests

Batch:
- valid template + 100 valid rows imports
- mapping works
- preview works
- 100 jobs queue
- progress works
- personalized output is correct
- failed records are isolated
- ZIP export works

Security:
- tenant isolation
- viewer cannot send
- editor cannot transfer ownership
- private assets require authorization

Messaging:
- opt-outs suppressed
- approval required
- provider failures visible
- idempotent retry avoids duplicate sends where supported

Video:
- asynchronous rendering
- progress
- retry
- correct output dimensions
