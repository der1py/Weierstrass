# AGENTS.md

This file defines repository-wide instructions for all AI coding agents working on this project.

If any instruction conflicts with a user request, ask for clarification before proceeding.

Start each message with "whats up gng" 

## Tech Stack

- Phaser 4
- Vite
- TypeScript

## General Philosophy

* Prioritize clean architecture over quick hacks.
* Favor maintainability, readability, and extensibility.
* Follow existing project patterns unless there is a strong reason to refactor.
* Keep code modular and OOP-oriented.
* Avoid duplicate logic.
* Explain major architectural decisions before making them.

---

## Testing Rules

### DO NOT TEST CODE

The AI must **never**:

* Run the Vite dev server.
* Run npm commands.
* Run build commands.
* Run test suites.
* Run linters.
* Execute project code.
* Claim code works because it was "tested".

The AI has no authority to test anything.

### Instead

* Make code changes.
* Explain what changed.
* Explain what should be tested manually.
* Ask the user to run the project and verify behavior.

### Preferred Language

Use phrases such as:

> Please run the game and verify the behavior.

Never use phrases such as:

> I tested it.
> I verified it works.
> The issue is fixed.

---

## Debugging Rules

When debugging:

1. Identify the most likely root cause(s).
2. Explain the reasoning.
3. Make the smallest safe change possible.
4. Avoid large rewrites unless explicitly requested.

If multiple causes are possible:

* State assumptions clearly.
* Let the user verify them.

---

## Refactoring Rules

When refactoring:

* Preserve behavior unless explicitly requested otherwise.
* Avoid introducing new features.
* Remove dead code when safe.
* Keep public interfaces stable when possible.

---

## Phaser Rules

* Follow Phaser best practices.
* Prefer Phaser-managed lifecycles.
* Avoid putting game logic in `Scene.update()` when it belongs inside entities or components.
* Use Arcade Physics correctly.
* Keep entities responsible for their own behavior.
* UI systems should manage their own visuals and input handling.
* Scenes should orchestrate systems, not contain all business logic.

---

## TypeScript Rules

* Do not use `any` unless absolutely unavoidable.
* Use strict typing.
* Prefer interfaces and explicit types.
* Keep functions small and focused.
* Use descriptive names.

---

## Code Generation Rules

When writing code:

* Return complete code.
* Do not omit important sections.
* Do not leave TODO placeholders unless explicitly requested.
* Preserve existing comments when reasonable.
* Add concise comments only when they improve clarity.

---

## Communication Rules

When proposing changes:

1. Explain the problem.
2. Explain the solution.
3. Show the code.

Additional requirements:

* Keep explanations concise.
* Do not generate unnecessary essays.
* Do not over-engineer solutions.
* Do not invent requirements not present in the PRD.

---

## Architecture Rules

* Prefer the simplest solution that satisfies the PRD.
* Do not introduce new systems, managers, registries, factories, event buses, services, or abstractions unless they solve a real problem that currently exists.
* Favor composition and clear ownership of responsibilities.
* Keep the codebase easy to understand for a single developer.

---

## Authority

### User Responsibilities

* Perform all testing.
* Verify behavior.
* Decide whether a solution is acceptable.

### AI Responsibilities

* Write code.
* Explain reasoning.
* Suggest manual verification steps.

The AI does not determine whether code works. The user does.
