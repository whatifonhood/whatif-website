---
title: The token
summary: The contract, the chain, the pool, and what each of those actually means.
---

$IF is an ERC-20 token deployed on Robinhood Chain. Everything below is public and readable by anyone with an internet connection.

## The contract

**`0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1`**

That is the only $IF. There is no second contract, no "V2", and no bridged version we have issued. A token with the same name and a different address is not this project — see [Wallets and custody](/docs/wallets-and-custody/) for why that matters more than it sounds.

The source is verified on the block explorer, which means the code you can read is provably the code that is running. It is a standard token contract named `LaunchToken`, compiled with Solidity 0.8.30.

## The chain

Robinhood Chain is an EVM network. In practice that means $IF behaves like any Ethereum-style token: the same wallets work, the same address format, the same way of reading balances.

Being on a newer chain has one honest consequence worth stating: fewer tools support it than support Ethereum. Some portfolio trackers will not show your balance, and some explorers will not resolve the address. That is a real inconvenience, not a conspiracy.

## The supply

**1,000,000,000 $IF.** Fixed.

Fixed here means something specific and checkable: `totalSupply()` returns that number, and the contract has no function that can increase it. Not "we promise not to mint" — there is no mint to call.

This matters because an inflating supply is the quietest way a token can dilute the people holding it. A holder cannot easily see it happening; they only see the price fall and assume the market decided that. [Supply and the burn](/docs/supply-and-burn/) has the numbers and the method.

## The pool

**`0x39A200271525E9641e799127bdAB299DAeF21953`**

That is the Uniswap V3 pool where $IF trades. It is also the third-largest holder of $IF, which is normal and worth understanding: a pool holds the tokens it is trading against. It is not a whale, and treating it as one misreads the distribution badly.

The [Who holds it](/docs/who-holds-it/) page names it explicitly for that reason.

## What we cannot tell you about the liquidity

We can tell you the pool exists, where it is, and how much is in it — all of that is on-chain.

We cannot currently show you a proof of who controls the liquidity position or whether it is time-locked. Establishing that properly means identifying the position NFT and its holder, and until that is done and published, this paper will not assert it.

That absence is deliberate. "LP locked" with nothing behind it is the single most common false claim in this market, and repeating it unproven would make everything else in this paper worth less.
