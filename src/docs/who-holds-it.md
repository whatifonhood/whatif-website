---
title: Who holds it
summary: The largest wallets, named where they can be identified.
---

"Does one wallet hold everything" is the first serious question anyone should ask about a token, and a percentage is not an answer to it. The [stats page](/stats/) publishes the fifteen largest holdings with every row linked to the address.

## Reading the table honestly

Two of the largest entries are not what they look like at a glance, which is exactly why they are labelled:

**The burn address is usually the biggest holder.** Those tokens are destroyed, not held. Counting them as a whale's position inverts the meaning — it is the single most reassuring row in the table, not the most alarming.

**The liquidity pool is usually near the top.** A pool holds the tokens it trades against. If it held nothing, you could not buy. It is infrastructure, not a position.

Strip those two out and what is left is the actual holder concentration. At the last reading, the largest genuine individual wallet held around 3% of supply.

## What we can and cannot tell you

We can tell you the addresses, the balances, and which are contracts. All of that is on the chain.

We cannot tell you who the people behind those addresses are. Nobody can, without their cooperation. Any project claiming to know its holders' identities is either running KYC or guessing.

We also cannot promise the distribution stays this way. A large holder can sell at any time, and no mechanism in the contract prevents it. See [Risks](/docs/risks/).

## Where the data comes from

The holder list is read from the block explorer at build time and committed to this repository, refreshed daily.

It is done at build time for a specific reason: the explorer sits behind a bot challenge and sends no CORS header, so a browser cannot call it. Rather than pretend otherwise or route it through a server we do not have, the list is fetched once during the build, and the page states the date it was read.

Addresses that cannot be identified are shown with no label rather than a guessed one.
