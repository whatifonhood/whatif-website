---
title: Liquidity, and what is actually locked
summary: One position in the main pool cannot be withdrawn by anyone; the other half of the depth can leave in a block.
---

$IF trades on a Uniswap V3 pool that was created by the launchpad in the same transaction that created the token. One position in that pool is locked in a way nobody can undo. The rest of the depth is not. This page separates the two, because that difference is the whole of what the phrase "liquidity locked" is usually doing when somebody says it.

Every figure below was read from the chain on 2 September 2026, at around block `52,582,784`. Pool balances move. The lock does not.

## The launch position

The main pool is `0x39A200271525E9641e799127bdAB299DAeF21953`, IF against WETH, in the 1% fee tier.

At launch the entire supply went into that pool as one Uniswap V3 position spanning ticks `[-887200, 204200]`, which is very nearly the full range the protocol allows. The position NFT, number `70641`, was transferred to NOXA's `LaunchLocker` contract in the same transaction that minted it, which [The launch](/docs/the-launch/) reads log by log.

That contract now holds the NFT, and its published ABI has no way to give it up. No transfer. No approve. No `decreaseLiquidity`. No burn. The only thing anyone can call against the position is `collectFees`, which sweeps the accrued trading fees and leaves the principal exactly where it is. [How the burn works](/docs/how-the-burn-works/) follows those fees to where they end up.

So this half deserves to be said at full strength: **the launch position is permanently locked, and that includes being locked against NOXA.** Not time-locked, not vested, not a commitment somebody made. There is no function to call.

Two things temper that, and both are about the publisher rather than the lock. The locker's verified source on the explorer is a partial match rather than a full one, so what is being read is source that matches the deployed bytecode in the parts the explorer could match. And the locker's owner, an ordinary wallet, can still redirect where the collected fees go. It cannot move, shrink or unwind the position itself.

## What the lock does not cover

Here is the correction, and it matters more than the good news above.

At the snapshot, the main pool's active liquidity was `71,612,362,060,397,110,157,213`, of which position `70641` supplied `36,819,258,015,569,838,458,222`. Active liquidity is Uniswap's own unit for how much depth is available at the current price. It is not a dollar figure, and the ratio is the part worth keeping:

- **51.4%** of the main pool's active liquidity is the permanently locked launch position.
- **48.6%** is ordinary Uniswap positions owned by ordinary wallets.

In plain words: roughly half the depth you trade against was put there by people who can take it back in a single block, without notice and without asking. They never agreed not to. If they did withdraw, the price impact of your sell would get worse immediately, and the locked half is what would be left holding the market up.

That is normal. A DEX-only token attracts third-party liquidity providers, and third-party liquidity providers leave when the fees stop being worth it. But it is not what a retail reader hears in the words "liquidity is locked", which is why this site does not use them. The phrasing here is **"the launch position is permanently locked"**, and it is chosen to be exactly as narrow as the evidence.

## The seven pools

$IF has liquidity in seven live pools, holding about $446,000 between them. About 85% of it sits in the main pool.

| Pool               | Liquidity | 24h volume | Created     |
| ------------------ | --------- | ---------- | ----------- |
| Uniswap V3 IF/WETH | $378,958  | $387,004   | 11 Jul 2026 |
| Uniswap V3 IF/USDG | $56,782   | $201,745   | 6 Aug 2026  |
| Uniswap V4 IF/ETH  | $6,811    | $21,545    | 31 Aug 2026 |
| Uniswap V4 IF/USDG | $3,433    | $481       | 23 Jul 2026 |
| Giga IF/USDG       | $231      | $956       | 28 Aug 2026 |
| Uniswap V4 IF/ETH  | $56       | $42        | 28 Aug 2026 |
| Uniswap V4 IF/ETH  | $8        | $4         | 27 Aug 2026 |

The second row is the interesting one. The IF/USDG pool on Uniswap V3 was created on 6 August by somebody other than the launchpad, and it now carries about a third of all $IF volume, against Robinhood Chain's own dollar stablecoin. None of it is locked. It is community liquidity in the literal sense: a person chose to put it there and can choose to take it out.

The lock covers one position in one pool. It has nothing to do with the other six.

## The protocol fee skim

One detail about the main pool that is easy to miss and easy to check. Uniswap's protocol fee is switched on there. `slot0.feeProtocol` reads `102`, which means one sixth of the 1% swap fee is skimmed on both sides of every trade before liquidity providers see any of it, and accrues to the owner of the V3 factory rather than to the positions.

At the snapshot that bucket held `0.0028` WETH and `2,314` IF.

Those amounts are trivial today, and the reason to mention them is not the size. It is that the IF side of the skim is fee income the locked position never earns, and so never burns. The burn is fed by what reaches the position after the protocol takes its sixth.

## What to do with this

Check it yourself rather than believing the paragraph above. The position ID, the pool address and the tick range are all in this page, and every one of them resolves on the block explorer.

Then read [Risks](/docs/risks/), which states the sell-side consequence without softening it: roughly half the tradeable depth can leave at any time, and thin markets move hard in both directions.
