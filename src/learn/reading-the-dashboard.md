---
title: How to read the dashboard
summary: What each figure on the stats page means, and which ones actually matter.
order: 5
updated: 2026-08-31
---

The [stats page](/stats/) shows a dozen numbers. They are not equally useful. Here is what each one is, and which ones would change a decision.

## Price and market cap

Price on its own says almost nothing — a token with a billion supply and one with a million are not comparable by price. Market cap is price times supply, and it is the number to compare across tokens.

Note that market cap counts every token in existence, including ones nobody can sell. That is why the burn matters below.

## Liquidity

**The most under-read number on the page.** Liquidity is how much value sits in the trading pool. It sets how much you can actually sell without moving the price against yourself.

A useful sanity check: if your position is a meaningful fraction of the pool, you cannot exit at the price you see. The chart is a picture of what small trades did, not a promise about what a large one would do.

## Volume, buys and sells

Twenty-four-hour volume is how much changed hands. The buy and sell counts underneath it, and the hourly pressure chart, say which direction the pressure came from.

Treat trade *counts* with suspicion on a cheap chain — it costs very little to generate a lot of them. Volume in dollars is harder to fake convincingly.

## Burned

Tokens sent to `0x…dEaD`, an address with no private key. Nothing can ever move them. This is not a promise made in a document; it is a balance on the chain, and the [burn curve](/stats/) plots every one of those transactions with a link to it.

Burned supply is genuinely gone, which is why it is worth separating from the circulating figure.

## Holders and concentration

The holder count is the weakest number here — one person can hold a thousand wallets, and on a cheap chain that costs almost nothing.

**Concentration is the number that matters.** The breakdown shows how much of the supply sits with the ten largest wallets, the next twenty, and everyone else. A token where the top ten hold most of it is one decision away from a very bad day, whatever the chart looks like.

## Biggest buy and sell

The largest single trade each way in the last day, with a link to the transaction. Useful for the same reason the concentration bar is: it tells you whether the day's movement was one wallet or many.

The window is stated explicitly, because the figure comes from a size-filtered query rather than a fixed time window and the span it covers varies with how busy the market was. Where the page cannot honestly claim a full day, it says what it actually has.

## The checks panel

Contract verified, honeypot check, fixed supply, burn address. These are asserted by third parties, not by us, and each links to where you can re-run it.

You will notice there is no claim here about locked liquidity or a renounced contract. Those claims were removed from this site because we could not evidence them, and they will not come back without transaction links.
