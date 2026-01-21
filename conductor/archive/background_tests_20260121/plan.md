# Implementation Plan: Reproducible Background Process Testing Suite

#### Phase 1: Test Harness Foundation
- [x] Task: Initialize testing environment and utilities
    - [x] Create `tests/integration/background/` directory.
    - [x] Write a base test runner or utility script to automate process spawning and PID tracking.
    - [x] Implement cleanup logic to ensure no "zombie" processes survive test failures.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Test Harness Foundation' (Protocol in workflow.md)

#### Phase 2: Core Lifecycle & Error Tests
- [x] Task: Implement Standard Lifecycle & Persistence tests
    - [x] Write integration test for background start, 5s persistence, and termination.
    - [x] Implement the test script and verify result logging.
- [x] Task: Implement Concurrency & Resource Conflict tests
    - [x] Write tests for simultaneous multi-port binding and conflict detection.
    - [x] Implement logic to verify "Address already in use" handling in background.
- [x] Task: Implement Crash & Recovery tests
    - [x] Write tests for immediate exit code capture and reporting.
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Core Lifecycle & Error Tests' (Protocol in workflow.md)

#### Phase 3: Data I/O & Interaction Tests
- [x] Task: Implement Output Streaming & Buffering tests
    - [x] Write tests to verify `stdout`/`stderr` capture and retrieval after backgrounding.
- [x] Task: Implement Interactive Re-attachment (Stdin) tests
    - [x] Write tests for providing input to a backgrounded interactive process.
    - [x] Implement the mock interactive script to receive the test input.
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Data I/O & Interaction Tests' (Protocol in workflow.md)

#### Phase 4: Advanced Capabilities & Orchestration
- [x] Task: Implement Notification & Monitoring tests
    - [x] Write tests to verify UI event emission on process completion.
    - [x] Implement resource usage (CPU/Mem) snapshot verification.
- [x] Task: Implement Dependency Orchestration tests
    - [x] Write a multi-step test (DB -> API sequence) with atomic cleanup.
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Advanced Capabilities & Orchestration' (Protocol in workflow.md)

#### Phase 5: Verification & Stress
- [ ] Run `pnpm lint`
- [ ] Run `pnpm test`
- [ ] Execute full integration suite under stress (10+ concurrent processes)