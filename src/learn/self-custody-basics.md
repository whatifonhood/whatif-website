---
title: Self-custody basics
summary: What a wallet actually is, what the recovery phrase does, and the mistakes that are not recoverable.
order: 2
updated: 2026-08-31
---

A crypto wallet does not hold your coins. The coins are entries on a public ledger; the wallet holds the key that proves those entries are yours. That distinction explains almost everything else about how wallets behave.

## The recovery phrase is the wallet

When you create a wallet you are given twelve or twenty-four words. Those words generate the key. Anyone with the words has the wallet — on any device, in any app, forever. Losing them means losing access permanently, and there is nobody to appeal to.

So:

- **Write them down on paper.** A screenshot lives in a photo library that syncs to a cloud account protected by a password somebody can reset.
- **Never type them into a website.** Your wallet app will ask for them when you restore. Nothing else ever legitimately will.
- **Store a second copy somewhere else.** Fires and floods are more common than hacks.

## Hot and cold

A hot wallet is connected to the internet — a browser extension or a phone app. It is convenient and it is what you use for day-to-day trading. A cold wallet is a hardware device that signs transactions without exposing the key.

The sensible rule is boring: keep what you are actively trading in the hot wallet, and anything you would be upset to lose on hardware.

## Gas, and why a transaction fails

Every action on a chain costs a fee, paid in the chain's native token — on Robinhood Chain that is ETH. If your wallet holds tokens but no ETH, you cannot move them, because you cannot pay to move them.

Always leave a small amount of ETH behind. It is the single most common way people find themselves temporarily stuck.

## Approvals accumulate

Trading on a decentralised exchange means granting a contract permission to spend a token on your behalf. That permission persists after the trade. Over time a wallet builds up a list of approvals, and any of those contracts can still act on it.

Reviewing and revoking old approvals occasionally is worth the ten minutes, especially for a wallet that has been used across many sites.

## Test with a small amount

Before sending anything substantial to a new address, a new chain, or a new bridge, send a small amount first and confirm it lands. Transactions are final. There is no support line, no reversal, and no chargeback.

## The trade-off, stated plainly

Self-custody means no institution can freeze your funds, and it means no institution can recover them either. Both halves of that are real. Anyone who tells you the second half is not a serious cost is selling something.
