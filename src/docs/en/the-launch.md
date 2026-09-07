---
title: The launch, and the launcher
summary: One transaction created the token, the pool, the lock and an 11% buy for the person who sent it.
snapshot: '2026-09-02'
---

$IF began as a single transaction on 11 July 2026. That transaction minted the supply, created the pool, locked the launch liquidity position and handed the address that sent it just over 11% of the tokens, all atomically. This page reads it back in order, because it is the part of the record a sceptic should check first, and because some of what it shows is not flattering.

## Nobody wrote a contract for What $IF

$IF is not bespoke code. It is NOXA's stock `LaunchToken`: an OpenZeppelin ERC-20 with a short launch-restriction block bolted onto `_update`. The same bytecode backs tens of thousands of tokens on this chain. A factory stamped this one out.

That cuts both ways, and both halves are worth stating. There was no development team, and there is nothing bespoke or clever about the token. It is also the reason the contract is as clean as it is. `LaunchToken` has no owner, no roles, no proxy and no upgrade path, no mint outside the constructor, no burn function and no tax logic at all. Nobody hid anything in it because nobody was writing it.

The source at `0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1` is a **partial match**, verified on 14 July 2026 through eth-bytecode-db rather than Sourcify. The factory that deployed it is not verified at all. NOXA never published that build. That is a fact about NOXA rather than about $IF, and it should be said that way rather than glossed.

## One transaction, eighteen logs

`0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c`

11 July 2026, 04:32:42 UTC, L2 block `6,657,668`, 6,994,056 gas. The caller sent 0.1705 ETH to the NOXA factory and received a token, a pool, a locked LP position and 11% of the supply back in one atomic step.

What happened inside it, in order:

1. The whole 1,000,000,000 IF was minted to the factory.
2. An IF/WETH pool was created on the 1% fee tier, at `0x39A200271525E9641e799127bdAB299DAeF21953`.
3. The pool was initialised at tick `204200` — the very top of the range, so it opened holding 100% IF and no WETH.
4. The entire supply was transferred into the pool as single-sided liquidity, over ticks `[-887200, 204200]`.
5. Position NFT `70641` was issued for that liquidity.
6. NFT `70641` was transferred to the NOXA `LaunchLocker`, which emitted `PositionLocked`.
7. `110,436,131.713888332` IF, 11.044% of supply, was transferred from the pool to the deployer.
8. 0.17 ETH was wrapped and swapped in through `SwapRouter02` — the atomic initial buy.

### Why 0.17 ETH bought 11% of the supply

Because the pool was initialised at the top of the position's range. In Uniswap V3 that means all token, no ETH, and an opening price near zero. The first buyer walks a nearly vertical curve, so a small amount of ETH takes a large share of the supply.

This is the intended mechanic of NOXA's launch design, not an exploit. It is also true that the launcher's entry price was structurally unavailable to anyone who arrived one block later. Both of those are the case at once, and you should not accept a version of this page that only tells you one of them.

## The launch restrictions, precisely

The constructor set three limits, and none of them survive today.

- **Max wallet 2%.** `maxWalletBps` was 200, so 20,000,000 IF, and it applied to everyone except the factory, the deployer and the pool.
- **Per-transaction cap: none in practice.** `maxTxBps` was set to 10000, which is 100% of supply. Buys were tracked per `tx.origin` against 110% of that, a ceiling of 1.1 billion tokens. It could not trigger.
- **The launch block was closed.** On the launch block itself, any buy from the pool reverted, except for the launch factory and the deployer.

`restrictionBlocks` was 366, and those are L1 blocks of roughly twelve seconds, not the chain's 101 ms L2 blocks. All of it expired permanently around 05:45 UTC on 11 July 2026. There is no residual privilege in the token today, for anyone.

## What became of the 110.44M

The deployer at `0x84F8E5a324466Deb7447048C014CF0245ce04afA` received `110,436,131.71` IF at 04:32:42 and sold every token of it inside about sixty seconds, in five transactions, all through the same router, all back into the pool the tokens had just come from.

| Sell      | IF out             | Share    | WETH received |
| --------- | ------------------ | -------- | ------------- |
| 1         | 55,218,065.86      | 50.0%    | 0.233739      |
| 2         | 13,804,516.46      | 12.5%    | 0.049099      |
| 3         | 10,353,387.35      | 9.4%     | 0.040792      |
| 4         | 15,530,081.02      | 14.1%    | 0.059348      |
| 5         | 15,530,081.02      | 14.1%    | 0.056404      |
| **Total** | **110,436,131.71** | **100%** | **0.439381**  |

The cost was 0.17 ETH plus a 0.0005 ETH launch fee. The proceeds were 0.439381 WETH. Net, the snipe made about 0.269 ETH — roughly $640 at the ETH price on the day these figures were read, 2 September 2026.

That number is smaller than the shape of the story suggests, and it is the accurate one. The deployer bought back 674 IF at some later point and moved it on. The balance has been zero since. This address has launched exactly one token on the NOXA factory, ever.

## The larger number

The honest headline is not the snipe. It is the fee stream.

NOXA's fee contract has paid `0x84F8E5a324466Deb7447048C014CF0245ce04afA` **18.2300 WETH** in creator earnings on $IF's trading fees, about $43,500 at the same 2 September reading. That is what the original launcher has taken out of this project, and it arrived through the launchpad's plumbing rather than through the token. [How the burn works](/docs/how-the-burn-works/) describes the same fee stream, because the IF side of it is what gets burned.

## Which sentences do not survive this

Four things get said about $IF launches like this one, and none of them are defensible here.

- "No insiders."
- "The deployer never held tokens."
- "Everyone had identical launch access."
- "No dev wallet."

The accurate version is one sentence: the launcher took an 11.04% atomic buy that the contract explicitly exempted from the wallet cap, sold all of it within a minute for a gain of about 0.27 ETH, has held nothing since, and has been paid roughly 18.2 WETH in launchpad creator fees.

All of that is true of the launch. The site, the tools and the socials were built afterwards, by people who say they turned up once the original developer had gone. That is a claim about who is who, and the chain does not settle it. What the chain does say is narrower: this deployer holds nothing, and it has never launched another token. A zero balance does not rule out related wallets, and nobody has attempted to cluster them. Take the launch as read and the separation as unproven. [What we do not claim](/docs/what-we-do-not-claim/) is where the rest of the missing sentences live.
