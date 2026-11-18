# Case Study: Building a Human + AI Hiring Workflow

*Andrew (Tuan Minh) Nguyen · AutoHR (two-person team with Harry Nguyen) · 2025*

## The problem
Small hiring teams spend most of their time on repetitive steps: writing job descriptions, screening resumes, chasing candidates between rounds, and grading assessments by hand. Teams wanted AI to take on the screening load, but **people still needed to make the decisions and be able to see why the AI suggested what it did.**

## Process first, then automation
We broke the workflow into stages and assigned each step to either the agent or a person:

| Step | Who does it |
|---|---|
| Understand the company & draft the JD | LangGraph agents (business-context analyzer → JD generator), reviewed by a person |
| Screen & score resumes | LangGraph resume ranker (criteria discovery → resume analysis) |
| Build the shortlist | **Person** reorders, re-scores, and adds or removes candidates (my ranking feature) |
| Run interview rounds | Platform-run technical + culture-fit assessments (my work) |
| Grade & decide | **Person** grades with structured scores; candidate moves along the kanban pipeline |
| Communicate | Automated emails, sent only after a person confirms the stage move |

The agents (built by Harry) produce suggestions. The product layer I built is where people review those suggestions and act on them, and where every action is recorded in the database.

## What I built
- **Ranking that people can adjust.** AI and assessment scores become a shortlist that hiring users can reorder and re-score. Every change is stored per job and per company (`CandidateRankingEndpoints`, `candidateRankingService.ts`). Reviewers can always override the model.
- **Culture-fit assessments as configuration, not code.** Hiring teams define their own values and weights and write scenario questions in the UI. Candidates answer six question types, and scores come back per value. A new client can set this up without a developer.
- **Structured grading.** Submissions and grades are first-class records in the API (CRUD, status, per-round configuration), so every hiring decision has a scored record behind it.
- **Pipeline guardrails.** Emails go out only after a person confirms. Moving a candidate backwards shows a warning. Sessions stay consistent across browser tabs. These small controls stop mistakes that would reach candidates.
- **Full-stack delivery.** Next.js/React/TypeScript UI, .NET 9 minimal-API endpoints, and the Supabase/PostgreSQL schema, built feature by feature from database to UI.

## Engineering decisions
- **Configurable data model for rounds.** We store round configurations as structured JSON per job. That lets one assessment engine serve technical, culture-fit, and other rounds without schema changes for each new round type.
- **A service layer between UI and API** (`services/*.ts`). It keeps fetch, auth, and error handling in one place, which made the move from mock data to the real database fast.
- **Agents behind an API boundary.** The LangGraph server is a separate service. The product consumes its outputs, so the prompts and the underlying OpenAI model can change without touching the app.

## What I'd do next (production readiness)
- Evaluation sets for the ranking agent (do its rankings agree with the people's rankings?) and drift monitoring.
- An audit trail of every case where a person overrides the AI, to use as feedback for the agents.
- CI with automated tests for grading and ranking logic, plus environment-based release management.
- Move ranking and assessment data into an analytics layer (for example a lakehouse) for hiring-funnel BI.

## Skills shown
Turning a business process into software · human-in-the-loop AI product design · full-stack TypeScript/React and C#/.NET · PostgreSQL data modelling · API design · working with LLM-agent outputs · shipping features end to end in a small team.
