---
title: The token
summary: The contract, the chain, the pool, and what each of those actually means.
snapshot: '2026-09-02'
---

$IF is an ERC-20 token deployed on Robinhood Chain. Everything below is public and readable by anyone with an internet connection.

## The contract

**`0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1`**

That is the only $IF. There is no second contract, no "V2", and no bridged version we have issued. A token with the same name and a different address is not this project — see [Wallets and custody](/docs/wallets-and-custody/) for why that matters more than it sounds.

It is a standard token contract named `LaunchToken`, compiled with Solidity 0.8.30. It was not written for this project. It is the stock template a launchpad called NOXA stamped out for every token it deployed, which is covered in [The launch](/docs/the-launch/).

The source on the block explorer is a **partial match**, verified on 14 July 2026 through eth-bytecode-db rather than Sourcify. A partial match means the published source compiles to the same runtime bytecode as the deployed contract, but not to a byte-for-byte identical artefact. So the logic you can read is the logic that is running. What it does not prove is that this exact source file — the same comments, the same settings — is the one that was compiled, which is what a full match establishes. NOXA never published the build that would allow one. That is a fact about the launchpad rather than about the token, and it is better said here than found later.

The contract has no owner, no admin roles, no proxy and no upgrade path. There is nobody to renounce and nothing to upgrade into. It also has no burn function of any kind: every $IF destroyed so far was sent to the dead address from outside the token, which [How the burn works](/docs/how-the-burn-works/) explains in full.

The one non-standard thing it ever did was a launch-restriction window that expired permanently about 73 minutes after deployment on 11 July 2026. [The chain](/docs/the-chain/) covers why that window is counted in Ethereum blocks rather than Robinhood Chain ones.

## The chain

Robinhood Chain is an EVM network. In practice that means $IF behaves like any Ethereum-style token: the same wallets work, the same address format, the same way of reading balances.

Being on a newer chain has one honest consequence worth stating: fewer tools support it than support Ethereum. Some portfolio trackers will not show your balance, and some explorers will not resolve the address. That is a real inconvenience, not a conspiracy.

## The supply

**1,000,000,000 $IF.** Fixed.

Fixed here means something specific and checkable: `totalSupply()` returns that number, and the contract has no function that can increase it. Not "we promise not to mint" — there is no mint to call.

This matters because an inflating supply is the quietest way a token can dilute the people holding it. A holder cannot easily see it happening; they only see the price fall and assume the market decided that. [Supply and the burn](/docs/supply-and-burn/) has the numbers and the method.

## The pool

**`0x39A200271525E9641e799127bdAB299DAeF21953`**

That is the Uniswap V3 pool where $IF trades. It is also one of the largest holders of $IF, which is normal and worth understanding: a pool holds the tokens it is trading against. It is not a whale, and treating it as one misreads the distribution badly.

The [Who holds it](/docs/who-holds-it/) page labels that row as the pool for the same reason, rather than leaving it to look like a whale.

## What is locked, and what is not

We can tell you the pool exists, where it is, and how much is in it. We can now also tell you who holds the liquidity position, which for a long time we could not.

The launch position is Uniswap V3 position NFT `70641`. It is held by NOXA's `LaunchLocker` contract, whose published interface contains no method to transfer the position, reduce its liquidity, or withdraw the principal. Nobody can take it out, including NOXA. That is not a timer that expires.

It is also not all of the liquidity. At the last snapshot, position `70641` supplied 51.4% of the main pool's active liquidity. The other 48.6% is ordinary third-party LP that can be withdrawn in a single block, and the six smaller pools $IF trades in are unlocked entirely. [Liquidity and the lock](/docs/liquidity-and-the-lock/) has the position, the holder, and the arithmetic.

"LP locked" with nothing behind it is the single most common false claim in this market, which is why this paper says the launch position is permanently locked rather than that liquidity is locked. The first is a statement about one position you can go and check. The second would tell you that the depth under the price cannot leave, and about half of it can.
