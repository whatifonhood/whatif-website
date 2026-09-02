---
title: Supply and the burn
summary: One billion, fixed, with a measurable amount permanently destroyed.
---

Two numbers describe the whole of $IF's monetary policy, and both are read from the chain rather than asserted here.

## Total supply

**1,000,000,000 $IF**, and it cannot go up.

The contract exposes `totalSupply()`, which returns `0x033b2e3c9fd0803ce8000000` — one billion with eighteen decimal places. There is no mint function, so this is not a policy anyone is choosing to follow. It is a property of the code.

## What has been burned

Burning a token means sending it to an address that nobody can spend from. The convention is `0x000000000000000000000000000000000000dEaD` — an address chosen because it is a valid destination whose private key cannot be derived. Tokens sent there are not "locked" or "held in reserve". They are unreachable, permanently, by everyone including us.

The current burned balance is read live on the [stats page](/stats/), and every individual burn is listed with a link to the transaction that made it. At the last snapshot it was around 9.3% of the supply.

Two things follow from that, and it is worth being precise about which is which:

- **The circulating supply is genuinely smaller.** That part is arithmetic.
- **A smaller supply does not make a token more valuable.** That part is not arithmetic, and anyone telling you otherwise is selling something. Burning changes the denominator, not the demand.

## Why the burn history is event-sourced

The obvious way to show a burn history is to ask the chain "what did this balance look like last month". Public nodes do not answer that — they are not archive nodes, and a request for historical state returns nothing rather than an error.

So the history is built the other way round: every `Transfer` into the burn address is read from the chain's own logs, once, and committed to this repository. The site then tops that up with anything that has happened since. That means the burn curve is reconstructed from primary evidence, and each point on it links to the transaction it came from.

## What this does not mean

It does not mean the supply is deflationary in any ongoing, promised sense. There is no automatic burn on every trade, no fee that feeds it, and no schedule.

Burns have happened. More may happen. Nothing in the contract compels them, and this paper will not imply a mechanism that does not exist.
