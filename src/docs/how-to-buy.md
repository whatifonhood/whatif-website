---
title: How to buy
summary: Step by step, with the mistakes that cost people money called out in advance.
---

Buying $IF takes four steps. The risky part is not any of them individually — it is the address, and step three exists entirely to protect it.

Nothing here is financial advice. Read [Risks](/docs/risks/) before you decide the amount.

## 1. Get a wallet

You need a self-custody EVM wallet. MetaMask, Rabby and Coinbase Wallet all work.

Write the recovery phrase on paper. Not a screenshot, not a password manager note, not a message to yourself. Anyone who sees those twelve words owns everything in the wallet, permanently, with no appeal.

Nobody legitimate will ever ask for it. Not us, not support, not a moderator, not a giveaway. See [Wallets and custody](/docs/wallets-and-custody/).

## 2. Add Robinhood Chain and fund it

$IF is not on Ethereum mainnet. Your wallet needs Robinhood Chain added as a network, and it needs the chain's native token to pay transaction fees — a swap with no gas simply will not go through.

## 3. Check the contract address, character by character

This is the step people skip, and it is the one that costs them everything.

**`0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1`**

Copy it from [whatifonhood.com](https://whatifonhood.com) or from the block explorer. Then check the **last six characters** against the source, not just the first six — address-poisoning attacks generate lookalikes that match at the start.

A token with our name and a different address is somebody else's coin, and buying it sends your money to them. This is the most common way people lose funds in a launch, by a wide margin.

## 4. Swap on Uniswap

Open Uniswap on Robinhood Chain, paste the contract address, choose your amount, and confirm.

Two things to expect the first time:

- **Slippage.** A thin market moves against you as you buy. If the swap fails, the tolerance is usually the reason — raise it a little, and understand you are agreeing to a worse price.
- **Two confirmations.** Some swaps need an approval first, then the swap itself. Two prompts is normal, not a bug.

## After you buy

Your balance is on the chain whether or not your wallet displays it. If it does not appear, add the token manually using the same contract address.

You can also confirm it independently with the [wallet lookup](/holdings/) — paste any address and it reads the balance straight from the chain. It never asks you to connect a wallet, because it does not need to, and no page on this site ever will.
