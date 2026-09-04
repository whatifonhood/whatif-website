# Reporting a security issue

**Please do not open a public issue for a security problem.**

Use GitHub's private reporting: the **Security** tab of this repository, then
**Report a vulnerability**. It opens a private thread that only the maintainers
can see, and it needs no email address on either side.

Say what you found, how to reproduce it, and what an attacker gets. A rough
note that reproduces beats a polished report that does not. You will get a
reply within **72 hours** saying what is being done about it and when.

If you would like credit, say so and you will get it. If you would rather not
be named, that is fine too.

## What is in scope

This is a static site with no server code, no accounts, no database and no
user data. That
rules out most of what a bug bounty usually covers, so the things that actually
matter here are:

- **Cross-site scripting.** Nothing on the page should be able to run script
  that we did not ship. The CSP is strict and Trusted Types is enforced; a way
  around either is a real finding.
- **Supply chain.** A dependency or GitHub Action that could execute code in
  the build. Actions are pinned by SHA and dependencies by lockfile — a way to
  move either is in scope.
- **Header and policy weakening.** A route that quietly serves a laxer CSP than
  `src/config/security-headers.ts` intends.

## What is not

- Findings from a scanner with no working proof — please show it doing
  something.
- Missing headers on assets where they do nothing.
- Anything that needs a compromised device or a browser extension.
- The token itself. This repository is a website. Questions about the contract,
  the liquidity or the burn belong in the white paper under `/docs`, and every
  claim there links to something on-chain you can check yourself.
- Volatility. $IF is a memecoin. It going down is not a vulnerability.

## What we already do

Documented in the **Security** section of the README, and enforced in CI:
a strict CSP with no `unsafe-inline`, Trusted Types, SHA-pinned Actions,
OSV-Scanner, gitleaks and CodeQL on every push, and no secrets in the
repository at all — the site needs none.
