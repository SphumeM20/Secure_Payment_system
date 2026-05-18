# Security Notes

This is a student demo project and not production banking software.

## Good security controls included

- bcrypt password hashing and salting.
- Server-side regex whitelist validation.
- Secure HttpOnly SameSite cookie for the session.
- CSRF token required for state-changing requests after login.
- HTTPS on API and React dev server.
- Helmet security headers.
- Login and global rate limiting.
- Role-based access controls.
- Parameterised SQL statements.
- Employee registration is not exposed publicly.

## What must be changed for production

- Replace the development TLS certificate with a trusted certificate.
- Replace the demo JWT secret with a long secret stored in a proper secret manager.
- Use a production-grade database such as PostgreSQL or SQL Server.
- Add audit logging for employee actions.
- Add multi-factor authentication for employees.
- Add monitoring and alerting.
- Add real SWIFT integration through approved banking channels.
- Run SonarQube, dependency scanning, MobSF for mobile and ScoutSuite for cloud before release.
