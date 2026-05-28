# Inventory Management System - Team Task Distribution

This document splits the project into 4 major parts for 4 team members.
You are the Team Leader and own the AI part plus additional coordination tasks.

## Team Members

- **Hrithik (Team Leader):** AI + architecture + integration + review
- **Dev:** Backend APIs + authentication + mail flow
- **Tanisha:** Frontend core pages + UI integration
- **Amogh:** Database schema + setup + testing + deployment support

## Part 1 - Critical Path (AI + Architecture + Integration) (Hrithik - Team Leader)

### Main Ownership
- AI prediction and analytics features (user + admin dashboards)
- System architecture decisions and shared conventions (source of truth)
- API contract ownership (request/response formats) across frontend/backend
- End-to-end integration + final quality gate before submission/demo

### File Paths
- `web/src/pages/AIPredictionPage.jsx`
- `web/src/components/AdminAIView.jsx`
- `web/src/pages/AdminPanelPage.jsx`
- `web/src/App.jsx`
- `web/src/components/Navbar.jsx`
- `server/scripts/seed_ai_test_data.php`
- `server/index.php` (AI-related endpoints and integration touchpoints)

### Assigned Tasks
- **Own the API contract**: define/lock JSON formats, error formats, and required fields so Dev + Tanisha can implement without mismatch
- **Own integration and final decisions**: resolve any conflicts between DB schema, backend endpoints, and frontend expectations
- Improve demand prediction and reorder suggestion logic in AI views
- Align admin AI dashboard and user AI dashboard behavior
- Define coding standards, branching rules, and merge checklist for the team
- Review and approve pull requests from Dev/Tanisha/Amogh before merge
- Resolve cross-module integration issues (frontend-backend-database)
- Prepare final demo flow, pitch order, and feature walkthrough
- Maintain release readiness checklist (must-pass scenarios + backup plan)

### Should Know
- React component architecture and state flow
- Chart.js basics for analytics visualization
- API contract design and JSON response consistency
- SQL fundamentals for validating AI output against real data
- Git workflow (branching, code review, conflict resolution)

## Part 2 - Backend Core APIs and Auth (Dev)

### Main Ownership
- PHP backend API reliability, auth/session security, and notifications

### File Paths
- `server/index.php`
- `server/auth.php`
- `server/db.php`
- `server/config.php`
- `server/response.php`
- `server/logger.php`
- `server/mail_helper.php`
- `server/mail_config.php`
- `server/test_mail_system.php`

### Assigned Tasks
- Stabilize CRUD APIs for products, purchases, and reports
- Validate all request inputs and return consistent error responses
- Improve authentication and session checks for protected routes
- Ensure mail alert flow works for low stock and admin notifications
- Add backend logs for important actions and failure paths
- Coordinate with frontend member on API contract updates

### Should Know
- Core PHP and MySQLi/PDO usage patterns
- REST-style endpoint design
- Session/auth handling in PHP
- Error handling, logging, and debugging
- Basic security practices (input validation, SQL safety, CORS awareness)

## Part 3 - Frontend Core Product Flows (Tanisha)

### Main Ownership
- User-facing pages, navigation, forms, and API integration on UI side

### File Paths
- `web/src/main.jsx`
- `web/src/pages/InventoryPage.jsx`
- `web/src/pages/PurchasePage.jsx`
- `web/src/pages/LoginPage.jsx`
- `web/src/pages/SignupPage.jsx`
- `web/src/pages/ContactPage.jsx`
- `web/src/pages/AdminLoginPage.jsx`
- `web/src/components/AppLayout.jsx`
- `web/src/components/Footer.jsx`
- `web/src/api/client.js`
- `web/src/styles/style.css`

### Assigned Tasks
- Complete inventory and purchase screens with correct validations
- Improve form UX and error/success feedback across auth pages
- Ensure navbar/footer/layout consistency across all screens
- Handle API states (loading, empty, error, success) cleanly
- Keep responsive behavior consistent on desktop and mobile
- Align UI output with backend data formats

### Should Know
- React hooks and component lifecycle basics
- State and form handling in React
- API consumption with fetch/axios patterns
- CSS layout (flex/grid), responsive design, and style consistency
- Basic UX principles for dashboard and form interfaces

## Part 4 - Database, Setup, and Quality Support (Amogh)

### Main Ownership
- Database schema correctness, setup reliability, seed data, and validation

### File Paths
- `database_setup.sql`
- `create_test_user.sql`
- `server/db/init.php`
- `server/scripts/add_user.php`
- `server/scripts/update_admin.php`
- `server/scripts/research_ids.php`
- `README.md`
- `LOGIN_GUIDE.md`
- `LOGIN_CREDENTIALS.md`
- `Run-StockXpert.bat`
- `Setup-Admin.bat`
- `Add-User.bat`

### Assigned Tasks
- Normalize and validate schema and constraints in SQL files
- Verify init flow correctly creates and seeds required data
- Maintain utility scripts for user/admin setup
- Keep setup and login documentation up to date
- Run sanity checks for fresh environment installation
- Prepare test dataset scenarios for team validation

### Should Know
- SQL schema design and relational constraints
- Data seeding and migration-safe update practice
- PHP script execution basics for setup scripts
- Reproducible environment setup and documentation discipline
- Basic QA checklist creation and execution

## Collaboration Rules (All Members)

- One feature branch per member (examples: `feature/dev-<task>`, `feature/tanisha-<task>`, `feature/amogh-<task>`, `feature/hrithik-<task>`)
- Raise PR only after self-test and lint check
- No direct commit to main branch
- API changes must be shared in team channel before merge
- Team Leader reviews and approves final merge order

## Weekly Delivery Plan (Suggested)

- **Day 1-2:** Individual module implementation
- **Day 3:** Pair integration (Backend + Frontend, DB + AI)
- **Day 4:** Full integration and bug fixing
- **Day 5:** Final testing, documentation, and demo rehearsal

