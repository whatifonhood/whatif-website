---
title: How Robinhood Chain works
summary: What the chain is, how to get ETH onto it, and where people get stuck.
order: 4
updated: 2026-08-31
---

Robinhood Chain is an Ethereum-compatible network. If you have used any EVM chain before, everything here will feel familiar: the same address format, the same wallets, the same kind of transactions. What differs is speed, cost, and how you get funds onto it.

## The parameters

Any EVM wallet can be pointed at it. The values are public and are the same ones this site uses everywhere:

- **Network name** — Robinhood Chain
- **Chain ID** — 4663
- **Currency** — ETH
- **RPC** — `https://rpc.mainnet.chain.robinhood.com`
- **Explorer** — `https://robinhoodchain.blockscout.com`

Most wallets will offer to add the network automatically the first time you visit a site that uses it. You can also add it by hand from those values.

## Getting ETH onto it

This is where nearly everybody gets stuck the first time, and the confusion is always the same: **ETH on Ethereum mainnet is not ETH on Robinhood Chain.** They are separate ledgers. Sending to the right address on the wrong network is the single most expensive mistake available here.

The simplest route is to withdraw ETH from the Robinhood app and select Robinhood Chain as the network. If your ETH is somewhere else, Robinhood documents the bridge routes that reach the chain.

Whichever way you arrive: send a small test amount first, confirm it lands, then send the rest.

## Fees

Blocks are fast and fees are small — small enough that the cost of a trade is dominated by the exchange's own fee rather than by gas. That is pleasant, and it has one consequence worth knowing: cheap transactions make it cheap to spam, so a token appearing to have many holders or many trades means less here than it would on an expensive chain.

Always leave a little ETH in the wallet. Tokens cannot be moved without it.

## Reading the explorer

Blockscout is the source of truth for anything you are told about a token on this chain. You can look up the contract, see the full holder list, and read the code if it has been verified.

Everything on this site links back to it. The [stats page](/stats/) shows figures read live from the chain, and each one has a link next to it so you can go and check the same thing yourself. If a claim about $IF cannot be reproduced there, it should not be believed — including a claim made here.
