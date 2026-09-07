---
title: Supply and the burn
summary: One billion, fixed, with a measurable amount permanently destroyed.
snapshot: '2026-09-02'
---

Two numbers describe the whole of $IF's monetary policy, and both are read from the chain rather than asserted here.

## Total supply

**1,000,000,000 $IF**, and it cannot go up.

The contract exposes `totalSupply()`, which returns `0x033b2e3c9fd0803ce8000000` — one billion with eighteen decimal places. There is no mint function, so this is not a policy anyone is choosing to follow. It is a property of the code.

## What has been burned

Burning a token means sending it to an address that nobody can spend from. The convention is `0x000000000000000000000000000000000000dEaD` — an address chosen because it is a valid destination whose private key cannot be derived. Tokens sent there are not "locked" or "held in reserve". They are unreachable, permanently, by everyone including us.

The current burned balance is read live on the [stats page](/stats/), and every individual burn is listed with a link to the transaction that made it. At a snapshot taken on 2 September 2026 it stood at 93,449,236.90 $IF, which is 9.3449% of the supply. Of the 425 transfers that make up that total, two came from ordinary wallets and amount to 2.84 $IF between them. The other 423 came from a single fee contract, which is the mechanism described below.

Two things follow from that, and it is worth being precise about which is which:

- **The circulating supply is genuinely smaller.** That part is arithmetic.
- **A smaller supply does not make a token more valuable.** That part is not arithmetic, and anyone telling you otherwise is selling something. Burning changes the denominator, not the demand.

## Why the burn history is event-sourced

The obvious way to show a burn history is to ask the chain "what did this balance look like last month". Public nodes do not answer that — they are not archive nodes, and a request for historical state returns nothing rather than an error.

So the history is built the other way round: every `Transfer` into the burn address is read from the chain's own logs, once, and committed to this repository. The site then tops that up with anything that has happened since. That means the burn curve is reconstructed from primary evidence, and each point on it links to the transaction it came from.

## What feeds the burn, and what it does not mean

An earlier version of this page said there was no automatic burn on every trade, no fee that feeds it, and no schedule. The middle clause was wrong, and correcting it matters more than anything else on this page.

There is a fee that feeds it. $IF trades in a Uniswap V3 pool with a 1% fee, and the launch liquidity position earns a share of that fee on every swap through the pool. That position is permanently locked, so its principal cannot be withdrawn by anyone, including us. It is not the only liquidity in the pool; [Liquidity and the lock](/docs/liquidity-and-the-lock/) covers the rest, and the distinction matters.

A keeper run by the launchpad that created the token sweeps the accrued fee out of that position. There have been 423 sweeps, the first on 11 July 2026 and the most recent on 1 September 2026. On the first ten the launchpad burned 80% of the $IF it collected and kept the rest. On all 413 since 12 July 2026 it has burned the $IF side in full. [How the burn works](/docs/how-the-burn-works/) sets out the addresses, the split, and where the ETH side of the fee goes.

So the burn is mechanical and driven by volume, and calling it nothing was wrong. What remains true is narrower. It is not in the token contract, so nothing on-chain compels it. It is not per-trade: fees accrue in the position and are swept in batches. It is not a schedule, and it is not ours to run. If that keeper is switched off, the fees simply accrue unswept and the burn stops, with no notice and no recourse.

Volume also sets the size, and volume has fallen a long way from launch week. Around the 2 September 2026 snapshot the supply was shrinking by roughly 0.014% a day. That is a real mechanism producing a small number, and it is not a reason to expect a price.
