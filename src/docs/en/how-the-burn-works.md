---
title: How the burn actually works
summary: An automated fee engine run by a third party burns $IF on most days, and it can stop whenever that party decides.
---

For a long time this paper said there was no fee feeding the burn. That was wrong, and the correction is large enough to need its own page. Every figure below was read from the chain on 2 September 2026, at or around block `52,582,784`.

Start with the plain version. The burn is not manual. It is not occasional. It is not unexplained. And it is not done by this community, which has burned nothing at all. It is an automated, volume-driven fee engine, operated by a third party, and it has fired 423 times.

## The mechanism, step by step

Nothing in the $IF token contract participates. The token has no burn function of any kind. All of this happens in the launchpad's plumbing, one layer above the token.

1. Traders pay the 1% Uniswap V3 fee. Position `70641`, the permanently locked launch position, spans essentially the whole price range, so it earns a share of every swap in the main pool.
2. NOXA's collector calls `collectFees` on the locker. The locker sweeps both sides of the accrued fees out of the position.
3. The locker splits the proceeds by `protocolFeeShare`, which currently reads `100`. The creator's on-chain share of the token side is therefore zero. You can see it happening: each claim emits a zero-value IF transfer from the locker to the original deployer.
4. The fee contract burns the IF side to `0x000000000000000000000000000000000000dEaD` and keeps the WETH side, which pays creator earnings and NOXA's own take.

So the token leg of the fee is destroyed and the ETH leg is monetised. Of the WETH collected off that position, `18.2300` has been paid to the original launcher as creator earnings and about `61.34` has been retained by NOXA.

## The evidence

Every one of the 425 transfers into the burn address has been decoded. 423 of them, totalling **93,449,234.06 IF**, came from one address:

**`0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417`**

That is NOXA's protocol fee recipient and authorised fee collector. The other two transfers are dust from ordinary wallets: `2.84` IF and `0` IF.

One thing to be clear-eyed about. That fee contract is 7,725 bytes of unverified bytecode, deployed by the locker's owner. Its source has never been published, so what it does is inferred from its behaviour on-chain and not from code anyone can read.

## What changed on day two

The split has not always been what it is now. For the first ten claims, from 11 July 06:46 UTC through 12 July 09:52 UTC, the contract burned 80% of the IF it collected and sent the other 20% to NOXA's original fee wallet:

**`0x71f2F1c2dc94cDaBFE29Cb355119f8683AE0969b`**

`14,468,370.53` IF went there. That is why that wallet still appears on the [holder table](/stats/), holding 1.45% of supply. It is not a mystery whale and it is not a team allocation. It is a launchpad's fee cut from the first two days.

From 12 July onward, 100% of the IF side has been burned, on all 413 subsequent claims.

## The shape of the burn over time

The burn tracks trading volume, which means most of it happened when volume was highest, which means most of it is already behind us.

| Period               | IF burned  | Share of the total burn |
| -------------------- | ---------- | ----------------------- |
| 11 Jul 2026, day one | 56,873,813 | 60.9%                   |
| Rest of July         | 29,950,521 | 32.0%                   |
| August               | 6,541,732  | 7.0%                    |
| September so far     | 83,171     | 0.1%                    |

Burns had happened on 51 of the 53 days between launch and the 2 September 2026 snapshot, so the engine is running steadily. It is simply running on much less fuel. Volume has fallen by roughly two orders of magnitude from the launch week, and at the current run rate the supply burns by about 0.014% per day.

Accrued in the position and awaiting the next sweep at the snapshot: `65,950` IF and `0.1967` WETH. That is the next burn, and it can be read live rather than taken on trust.

## Who NOXA is, and what that means

NOXA is the launchpad that stamped out the token. The dates matter, because they explain why the fee configuration has never been renegotiated.

The `LaunchLocker` was deployed on 16 June 2026, two weeks before Robinhood Chain's public mainnet opened, with the protocol share set to 65. On mainnet day, 1 July, the share was raised from 65 to 100 and the current fee contract was authorised as a collector. $IF launched on 11 July under that configuration. The same day, NOXA announced it would stop accepting new token launches. Two days later its website went dark, and on 14 July it posted that it would no longer collect fees and would redirect 100% of revenue to creators.

That statement and the on-chain state have not reconciled. As of the most recent claim on 1 September 21:14 UTC, `protocolFeeShare` still reads `100`, and the locker's `ProtocolFeeUpdated` log shows no change since 1 July.

Two readings fit, and nothing on-chain settles between them. Either the announcement was never applied to this locker, or it was applied to the token leg rather than the ETH leg, since 12 July is exactly when the IF side stopped being partly retained and started being burned in full. Treat that as interpretation, not fact.

Nobody knows who is behind NOXA. It is not established by any source reviewed. The locker's owner is a bare externally-owned account and the fee contract is unverified bytecode.

## What can go wrong

This section belongs here as much as it belongs on [Risks](/docs/risks/), because a mechanism is only as good as the thing it depends on.

**The burn can stop at any time, and nothing on-chain would prevent it.** It needs a live third-party keeper to keep calling `collectFees`. Switch that off and the fees simply accrue inside the position, unburned and unclaimed, for as long as nobody calls it.

**The locker's owner can change the terms.** That address is `0x7E035Fb048a31e0481b88074557415b1C187242B`. It can change the fee share, change the recipient, and authorise or revoke collectors. It cannot move or unwind the LP position, which is the part that stays locked. The community has no say in any of this and would get no notice.

**Only the original deployer can redirect the creator slot.** `setFeeRedirect` for $IF is callable by that address alone, and it has never been set. If a fee share were ever negotiated, that is the single function that would have to be called, and only the launcher can call it.

**The operator is anonymous and unaccountable.** See above.

## What this does not mean

It does not mean the supply is deflationary in any promised sense. Nothing in the token contract compels a single one of these burns. The engine exists because a launchpad configured it that way and left it running, not because $IF has a guarantee.

It also does not mean a smaller supply is worth more. That part has not changed and never will: burning moves the denominator, not the demand.

What is left is a plain description. A launchpad shut down and left an engine running that destroys the token side of the fee. The mechanism is real, it is running, and it belongs to somebody else who can stop it. Those go in the same sentence, or the sentence is wrong. The live burn total is on the [stats page](/stats/); the supply arithmetic is in [Supply and the burn](/docs/supply-and-burn/); what is and is not locked is in [Liquidity and the lock](/docs/liquidity-and-the-lock/).
