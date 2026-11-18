# Andrew (Tuan Minh) Nguyen: Contributions to AutoHR

AutoHR was built by two people. Harry (Quang) Nguyen led the LangGraph AI agents and the platform architecture. I owned most of the **hiring-team product**: the React/Next.js frontend, plus the .NET endpoints and Supabase data model behind those features.

**At a glance:** 65 commits (May–Sep 2025), roughly 90k lines across `react-frontEnd/` and `dotnet-backend/`.
To check: `git log --author="Andrew" --oneline` or `git shortlog -sn`.

## Features I designed and built

### 1. Culture-fit assessment rounds (frontend + backend)
A configurable, values-based assessment that hiring teams attach to a job's interview pipeline.
- **Configuration UI** (`components/interview_pipeline/rounds/CultureFitConfig.tsx`): hiring users define company values, give each one a weight, and write scenario questions mapped to those values.
- **Candidate experience**: six question types (scenario, rank-the-scenarios, slider, multiple choice, open-ended, game-style) with per-question timers and a guided instructions flow.
- **Scoring**: weighted, per-value scores so reviewers see *which* values a candidate matches, not just one number.
- Commits: `1ffbf6f` (full functionality), `5297baa` (config UI), `bfde15d` (scenario logic, front + back)

### 2. Assessment submissions & grading (technical rounds)
- .NET `AssessmentEndpoints`: CRUD for submissions and grades, round configuration, submission status, and result submission.
- Grading UI so reviewers can mark, edit, and delete grades, and view each candidate's submission.
- Commits: `62bc6d1` (marking logic), `11db0da` (grading pages), `a0a13e7` (view submission), `c6691dc` (edit/delete grades)

### 3. Candidate ranking
- `CandidateRankingEndpoints` (.NET) and `candidateRankingService.ts`: add or remove candidates in a job's ranking, reorder them, re-score them, and query by job or company.
- Ranking UI combines profile, education, and assessment scores into a shortlist that hiring teams can reorder.
- Commits: `3f1298e` (ranking logic + DB), `9ebb1af`, `87525ce`

### 4. Interview pipeline (kanban) & candidate communication
- Drag-and-drop stage pipeline. Moving a candidate triggers email notifications through a confirmation step, and moving one backwards shows a warning so they aren't regressed by accident.
- Bulk notifications to candidates.
- Commits: `d428635`, `63d3254`

### 5. Jobs & candidates management
- Job board, job detail, create/edit/draft/publish, job status lifecycle, filter sidebar, and per-user-type view counts.
- Candidate list and detail pages, stage/status redesign, and recruiter notes (Supabase).
- Applicant side: apply form, application success page, applicant profile & settings.
- Commits: `c6e287c` (job status), `f482397` (view counts), plus the `feat(jobs)`, `feat(candidate)` and `feat(applicants)` series

### 6. Auth & session handling
- Cookie-based sessions that persist across tabs, and logout in one tab logs out every tab.
- Early .NET backend setup with basic authentication and authorization.
- Commits: `36801fc`, `81e369f`

## What Harry led (for clarity)
- The `langgraph_server/` agents: business-context analyzer (with web crawler), job-description generator, and the resume ranker (criteria discovery + resume analysis agents).
- Overall architecture, JWT/refresh-token auth, Gmail/Calendar integrations, and the later frontend redesign.

We reviewed and merged each other's work throughout, so some features overlap.
