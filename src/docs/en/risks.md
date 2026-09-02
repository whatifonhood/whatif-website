---
title: Risks
summary: The ways you lose money here, stated plainly rather than buried.
---

This page is not a disclaimer bolted on for cover. If you read one page before buying, read this one.

**You can lose everything you put in.** Only commit money whose complete loss would change nothing important about your life.

## The price can go to zero

A meme coin's price rests entirely on other people continuing to want it. There is no revenue underneath it, no asset backing it, and no floor.

Most tokens in this category end up effectively worthless. Not a dramatic collapse — attention moves on, volume dries up, and what is left is a chart nobody looks at. That is the ordinary outcome, not the rare one.

## Survivorship bias is working on you

You know about the coins that went up a hundredfold. You have never heard of the thousands that did not, because nobody wrote a thread about those.

This distorts the perceived odds enormously. Every story that reaches you has already been filtered for success by the fact that it was worth telling.

The whole premise of this coin — _what if you had bought earlier_ — runs on exactly that distortion. We think naming it is more honest than exploiting it quietly, but naming it does not switch it off.

## Liquidity is thin

Small markets move hard in both directions. A buy that would be unremarkable elsewhere can move this price noticeably, and so can a sell.

Practically: you may not be able to exit at the price you see. Slippage is the visible part of that; the invisible part is that a large enough sell may not find buyers at all.

## Concentration

A handful of wallets hold a meaningful share, as [Who holds it](/docs/who-holds-it/) shows in full. Any of them can sell at any time, without warning, and nothing in the contract prevents it.

The distribution is reasonable by the standards of this market. That is not the same as safe.

## Only about half the liquidity is locked

This page used to say we could not show you who controls the liquidity position. We can now, so here it is.

The launch position, Uniswap V3 position NFT `70641`, is held by the launchpad's locker contract. That contract has no method to transfer it, approve it, reduce its liquidity or burn it. The principal cannot be withdrawn by anyone, including the launchpad that put it there. [Liquidity and the lock](/docs/liquidity-and-the-lock/) shows how to read that for yourself.

The risk did not disappear. It moved. At the last snapshot the locked position supplied 51.4% of the main pool's active liquidity. The other 48.6% is ordinary positions owned by ordinary people, and so is all of the liquidity in the six smaller pools. About half the depth you would be selling into can be withdrawn in a single block, by people under no obligation to leave it there, with no warning.

That is normal for a token that trades only on a DEX. It is also not what "liquidity locked" suggests to someone reading quickly, which is why this paper does not use that phrase on its own.

## The burn depends on a keeper that can stop

Nothing in the $IF contract burns anything. The burn is fee revenue: trading fees accrue to the locked launch position, the launchpad's collector sweeps them, and the $IF side of the sweep is sent to the dead address. [How the burn works](/docs/how-the-burn-works/) sets out the whole path.

Every step of that except the fee accrual needs somebody to call a function. If the launchpad's keeper stops calling it, fees accrue in the position and stay there, unburned and unclaimed, indefinitely. Nothing on-chain compels the call, and no announcement is owed to you before it stops.

Worth knowing in that context: the launchpad stopped accepting new launches on the day $IF launched, and its website went dark two days later. The sweeps have continued anyway, most recently on 1 September 2026. Continuing is not the same as being obliged to continue.

## The fees can be pointed somewhere else

The locker's owner is a single ordinary wallet. It cannot touch the locked position, but it can change the fee share and the fee recipient, and between them those two settings can send 100% of future fees to any address it chooses.

That is two function calls. No vote, no notice, no appeal. The burn is fed by that stream, so redirecting the stream ends the burn, and you would find out by watching the chain afterwards.

## Parts of the machinery cannot be read

The $IF token's source is published on the explorer as a partial match rather than an exact one, and so is the locker's. The launchpad's fee contract is unverified bytecode. Its factory is not verified at all.

That is a fact about the launchpad rather than about $IF, and it should be read that way: nobody published those builds. The consequence for you is the same either way. Part of what the burn runs on can only be checked by watching what it does, not by reading what it says.

## Nobody knows who is behind the launchpad

No source we have reviewed establishes who they are. The locker's owner is a bare address. The fee contract is unverified bytecode deployed by that same address. Everything the burn depends on runs through people nobody can name.

We are not alleging anything by saying so. We are saying that if the burn stops or the fees move, there is nobody to ask and nobody accountable. Decide what the burn is worth to you with that in the picture.

## Regulatory and platform risk

Rules around tokens vary by country and change. Exchanges delist. Wallets and explorers drop support for chains. Any of that can affect your ability to trade or even see your holding, independently of the token itself.

## Your own mistakes

The most common way people lose money here is not a market move. It is buying the wrong contract, losing a recovery phrase, or signing something they did not read. [Wallets and custody](/docs/wallets-and-custody/) covers each.

None of those are reversible. There is no support desk and no chargeback.

## Nothing here is advice

Nobody involved is licensed to advise you, and this paper is not a recommendation to buy, hold or sell anything. It is a description of what the thing is.
