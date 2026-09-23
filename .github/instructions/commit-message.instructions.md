# Commit message format
- Use conventional commit format for commit messages based on commitlint.config.cjs . The format is as follows:
  - `<type>(<scope>): <ticket> <description>`
  - `<type>`: A required noun describing the type of change (e.g., feat, fix, docs, style, refactor, test, chore).
  - `<scope>`: A required noun describing the scope of the change part of the scope-enum list in commitlint.config.cjs.
  - `<ticket>`: A required Jira ticket number with prefix identifier defined with issuePrefixes in commitlint.config.cjs.
  - `<description>`: A short description of the change describing the task you execute.

- fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).
- feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).
- BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.
- types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the Angular convention) recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others.
- footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.

- If no Jira ticket is provided in the conversation or context, you MUST ask the user for it before creating a commit.
- If you execute task on specific developer's PR, you must get the ticket number from the PR's commit message and use it as a commit message for the task you executed.
- NEVER generate or push a commit without a Jira ticket.
