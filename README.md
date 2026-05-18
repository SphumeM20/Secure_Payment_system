# APDS7311w Secure International Payments Portal

This is a complete student-style project package for the APDS7311w POE international payments scenario.

It contains:

- `api/` - secure Node.js API with HTTPS, password hashing/salting, JWT session cookies, CSRF token checks, regex input whitelisting, rate limiting, security headers, and SQLite storage.
- `web/` - React portal for customers and bank employees.
- `.circleci/config.yml` - CI pipeline example with SonarQube scanning.
- `sonar-project.properties` - SonarQube configuration.
- `docs/` - report and PDF deliverables.
- `diagrams/` - architecture/data-flow diagrams in Mermaid format.

## Demo users

Employee login is seeded automatically:

- Username: `EMP001`
- Password: `Employee@12345`

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

Because a self-signed development certificate is included, the browser may show a warning. Accept it for local testing only. In production you must use a trusted certificate.

## Suggested video demo flow

1. Open the customer portal.
2. Register a customer.
3. Login with the account number and password.
4. Capture an international payment.
5. Logout.
6. Login as employee using the seeded employee account.
7. View the pending payment.
8. Verify the SWIFT/account details.
9. Send the payment to SWIFT.
10. Show the status changed in the portal.

## Security controls shown in the project

- Password hashing and salting using bcrypt.
- Regex whitelist validation on API and React forms.
- HTTPS on API and React dev server.
- Secure HttpOnly cookies.
- CSRF header token check.
- Helmet security headers, including clickjacking protection.
- Rate limiting for login and API calls.
- Parameterised database queries.
- Input length limits and JSON body size limit.
- Role-based access for customer and employee endpoints.
- SonarQube configuration for code smells and security hotspots.
