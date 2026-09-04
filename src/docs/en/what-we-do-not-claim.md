---
title: What we do not claim
summary: The sentences you would expect here, and why each one is missing.
snapshot: '2026-09-02'
---

Most of this paper is what $IF is. This page is the negative space, because in this market the claims a project declines to make say more than the ones it makes.

Each item below is something we could write, that would help the coin, and that we are not writing — because we cannot evidence it, or because the chain says it is not true.

## "Liquidity is locked"

Absent as a flat statement, and replaced with the narrower version we can prove.

What this paper does claim: the launch position is permanently locked. It is Uniswap V3 position NFT `70641`, it is held by NOXA's `LaunchLocker`, and the locker's published interface has no transfer, no approve, no decrease-liquidity and no burn method. There is no function anyone can call to get that principal out — not us, not NOXA, not the address that owns the locker.

What this paper still refuses to claim is the three-word version. At the last snapshot that position supplied 51.4% of the main pool's active liquidity. The other 48.6%, plus everything in the six smaller pools, is ordinary LP that its owners can withdraw in a single block.

So roughly half the depth you trade against can leave without warning. "Liquidity is locked" would let you assume otherwise, and that assumption would be our doing rather than the market's. [Liquidity and the lock](/docs/liquidity-and-the-lock/) has the position, the pools and the split.

## "Ownership renounced"

Absent, and replaced with something better.

Renouncement implies there was an owner who gave up control — which you would have to trust happened properly. On this contract, `owner()` reverts because **the function was never there**. Nobody can pause it, upgrade it, or mint into it, and you can confirm that yourself in about ten seconds.

We removed the renounce badge and put the live reading in its place.

## "Audited"

Absent. No third-party security audit has been commissioned.

The contract is a standard token, its source on the explorer is a partial match, and you can read all of it. Not everything around it can be read at all: the launchpad's fee contract, which has performed every burn, is unverified bytecode whose source has never been published. Neither of those is an audit, and neither is presented as one.

## "No dev wallet, no insiders"

Absent as a description of the launch, whatever it is worth as a description of the project today.

The accurate sentence is longer, and we would rather write the longer one. The launcher took an 11.04% buy in the same transaction that created the token, exempted from the wallet cap by the contract itself, sold all of it inside 60 seconds for a net gain of about 0.269 ETH, has held nothing since, and has been paid about 18.23 WETH in creator fees by the launchpad. The people running the project now say they arrived after the original developer had gone. Nothing on the chain contradicts that, and nothing on the chain establishes it either: addresses are not identities, and no attempt has been made to cluster them. It is not offered here as a defence of the sentence before it.

[The launch](/docs/the-launch/) sets it out log by log, including the exemption in the contract.

## "The burn is community-driven"

Absent, because it is false. Every burn so far was executed by NOXA's fee contract, which sweeps the trading fee off the locked position and burns the $IF side of it — all of it, since 12 July 2026. It has run 423 times. This community has burned nothing.

Saying so is not modesty. It is the difference between a story you can check and one you cannot, and it is also the risk: the burn belongs to somebody else's keeper and stops the day that keeper stops. [How the burn works](/docs/how-the-burn-works/) explains the mechanism and what its ending would look like.

## Price targets, forecasts, "next 100x"

Absent, permanently. Nobody knows, and anyone who tells you they do is selling.

## A utility roadmap

Absent. There is no product coming that makes the token necessary for something.

The [roadmap](/roadmap/) lists things built for the site — tools, pages, translations. Everything on it that has shipped stays on it, so the record of what was promised against what arrived is permanent and checkable.

## Partnerships, listings, endorsements

Absent unless independently verifiable at the time of writing. No implied association with Robinhood beyond running on Robinhood Chain, which is a public network anyone can deploy to.

## A treasury, a team allocation, a vesting schedule

Absent, because there is no such structure to describe. The [holder table](/stats/) shows the actual distribution, including the wallets we cannot identify.

## Why bother

Because the one thing a coin with no product can offer is that it never lied to you. That is only worth something if it holds when lying would be useful — which is precisely here, on the page where the claims would go.
