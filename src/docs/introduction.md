---
title: Introduction
summary: What $IF is, in the fewest words that are still true.
---

$IF is a meme coin on Robinhood Chain. It has no product, no revenue, no treasury and no roadmap of features it owes you. It is a token, a joke that got out of hand, and a question printed on the side.

That question is **what if**.

## What this paper is

Most white papers exist to make a token sound like a company. This one exists to do the opposite: to write down what $IF actually is, what it is not, and how to check both without believing anything on this page.

There are twelve sections. Three explain the coin. Three prove the numbers. Three cover buying and holding it. Three say the uncomfortable parts out loud.

If you read only one, read [Verify it yourself](/docs/verify-it-yourself/). Everything else in this paper is downstream of it.

## What $IF is not

It is not an investment product. Nobody here is licensed to advise you, and nothing in this paper is advice. It is not a stake in a business, because there is no business. It does not entitle you to revenue, governance, or a claim on anything.

It is also not an attempt to look like those things. That distinction is the whole point of the project, and the reason this paper spends more time on what is absent than on what is promised.

## The three facts that matter

These are the load-bearing claims of the entire project. Each one is checkable on the chain in under a minute, and [Verify it yourself](/docs/verify-it-yourself/) gives you the exact command for each.

1. **The supply is fixed at one billion.** `totalSupply()` returns exactly that, and there is no mint function.
2. **The contract has no owner.** `owner()` does not revert because we renounced it — it reverts because the function was never there. Nobody can pause it, upgrade it, or mint into it.
3. **Tokens have been burned, permanently.** They sit at an address whose private key does not exist and cannot be constructed.

Everything else on this site is either one of those three restated, or a tool for looking at them.

## Who wrote this

The same people who removed the "LP locked" and "ownership renounced" badges from the front page for lack of evidence, and replaced them with a panel that reads the chain live and shows whatever it finds — including when it cannot find anything.

That is the standard the rest of this paper is held to.
