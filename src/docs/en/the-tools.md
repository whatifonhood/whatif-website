---
title: The tools
summary: What each part of the site does, and what it deliberately does not.
---

The site is a set of small tools over public data. None of them needs an account, a wallet connection, or a signature. All of them work with JavaScript disabled, to the extent that showing live data allows.

## Stats

The [dashboard](/stats/). Price, market cap, liquidity, volume and holders, with the figures rendered from a snapshot at build time and replaced with live ones when the APIs answer. If a call fails, the page keeps showing the snapshot with the date it was captured rather than a spinner or a blank.

It also carries the price chart, buy and sell pressure, the burn history with every transaction linked, the holder table, the checks anyone can run, and the commands from [Verify it yourself](/docs/verify-it-yourself/).

## Wallet lookup

The [lookup](/holdings/) takes any address and reads its $IF balance from the chain. No connection, no signature, nothing to approve — a public read needs no permission.

You can check any address, including ones that are not yours. That is a property of a public ledger, not a feature we added.

## Ask a better question

The [question generator](/ask/). A few thousand variations on _what if_, plus one shared question a day that is the same for everybody.

It is the least serious tool here and the closest to the point of the whole project.

## Find your coin

The [coin pull](/pfp/). 150 pieces of artwork across four rarities. Free, no wallet, nothing minted, nothing on-chain — it is a picture, and pulling one costs nothing because there is nothing to charge for.

What you have pulled lives in your own browser and is never sent anywhere. A code can move a collection between devices.

## The vault

The [memes](/memes/), full resolution, no watermark, no credit needed. Take them.

## What is deliberately absent

- **No wallet connection**, anywhere, for the reasons in [Wallets and custody](/docs/wallets-and-custody/).
- **No price predictions**, no targets, no "next 100x".
- **No third-party trackers.** Analytics are first-party and carry no cookies; the community wall renders posts from text fetched at build time rather than embedding anything that would watch you read it.
- **No claims we cannot evidence.** See [What we do not claim](/docs/what-we-do-not-claim/).
