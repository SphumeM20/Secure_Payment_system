# Secure International Payments Portal

This is a complete student-style project package for the APDS7311w POE international payments scenario.

It contains:

* `api/` - secure Node.js API with HTTPS, password hashing/salting, JWT session cookies, CSRF token checks, regex input whitelisting, rate limiting, security headers, and SQLite storage.
* `web/` - React portal for customers and bank employees.
* `.circleci/config.yml` - CI pipeline example with SonarQube scanning.
* `sonar-project.properties` - SonarQube configuration.
* `docs/` - report and PDF deliverables.
* `diagrams/` - architecture/data-flow diagrams in Mermaid format.

## Demo users

Employee login is seeded automatically:

* Username: `EMP001`
* Password: `Employee@12345`

Customers can register from the customer portal.

## Run locally

Open two terminals.

### Terminal 1 - API

```bash
cd api
npm install
npm run dev
```

API runs at: `https://localhost:5001`

### Terminal 2 - React portal

```bash
cd web
npm install
npm run dev
```

React app runs at: `https://localhost:5173`



## 

