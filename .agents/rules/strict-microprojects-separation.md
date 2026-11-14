---
trigger: always_on
description: Enforce strict separation, isolation, and independence of all micro-projects in the repository. Never combine or bind them together.
---

# Strict Micro-Projects Separation & Isolation Rule

This workspace (`MicroProjects`) is a monorepo holding completely separate, standalone micro-projects. Every agent working in this repository MUST follow these rules without exception:

## 1. Zero Root Bindings / Never Combine Projects
- **NEVER** create an `index.html`, root portal, navigation hub, dashboard, or combining router at the root of `MicroProjects/`.
- The repository root must only contain project subfolders, `.gitignore`, and repository-level documentation (`README.md`, `AGENTS.md`).
- Never bind, aggregate, or bundle the projects together into a single application.

## 2. Complete Project Autonomy & Self-Containment
- Each micro-project folder (e.g. `RFcolor/`, `sumospik/`, etc.) is an entirely independent, standalone application.
- Each micro-project must contain its own self-contained assets (`index.html`, `index.php`, `styles.css`, `app.js`, `pb.js`, `.htaccess`, `README.md`).
- **NEVER** reference, import, or link styles, scripts, or assets across project boundaries (e.g. `sumospik` must never reference `RFcolor`, and vice versa).

## 3. Dedicated Local Deployment & Execution
- When serving or deploying a micro-project locally, **ALWAYS** target the specific project folder directly:
  - Correct: `python -m http.server 8080 -d sumospik` or `php -S localhost:8080 -t sumospik`
  - Correct: `python -m http.server 8081 -d RFcolor` or `php -S localhost:8081 -t RFcolor`
  - **FORBIDDEN**: Running a web server from the repository root to host multiple micro-projects under sub-paths.

## 4. Strict Backend & Multi-Tenant Isolation
- Each micro-project interacts exclusively with its own assigned PocketBase collections using its unique prefix (e.g., `sumospik_` for SumoSpik, `RFALL_` for Alliance Roster).
- Each project uses its own dedicated service user account (`sumospik@zece.info`, `rfall@zece.info`), tokens, and least-privilege API rules.
- Projects must never read, write, or query collections belonging to another project.
