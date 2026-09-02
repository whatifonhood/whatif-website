---
title: The chain it runs on
summary: What Robinhood Chain is, what it was built for, and two quirks that make $IF's own numbers look wrong until you know about them.
---

$IF did not choose its chain in any meaningful sense. It was stamped out by a launchpad, on the network that launchpad happened to run on. But the chain decides what you can check, which tools will show you your balance, and how two of the numbers in this paper have to be read. So it is worth describing precisely.

## What Robinhood Chain is

Robinhood Chain is an Ethereum layer 2, built by Robinhood with Offchain Labs on the Arbitrum stack, settling to Ethereum. Public mainnet opened on 1 July 2026, announced at Robinhood's "The World is Flat" keynote in London, after a testnet that had processed more than 200 million transactions.

It runs under the Arbitrum Expansion Program licence, which directs 10% of protocol net revenue to Arbitrum: 8% to the ArbitrumDAO and 2% to the Developer Guild.

Running on a chain Robinhood built is not a relationship with Robinhood. It is a public network. Anyone can deploy to it, and a launchpad did.

## The details you would need to connect to it

| Field      | Value                                                          |
| ---------- | -------------------------------------------------------------- |
| Chain ID   | `4663` (`0x1237`)                                              |
| Gas token  | ETH, base fee `0.366` gwei at the 2 September 2026 snapshot    |
| Block time | `101.3` ms measured, over `100,000` blocks in `10,134` seconds |
| RPC        | `https://rpc.mainnet.chain.robinhood.com`                      |
| Explorer   | `https://robinhoodchain.blockscout.com`                        |

The block time is the thing to hold on to. Blocks arrive roughly ten times a second, which is what makes the first quirk below confusing rather than obvious.

## What the chain was built for, and what turned up

The design brief was tokenised real-world assets: restructured Stock Tokens as tokenised debt securities, a dedicated Uniswap AMM, Morpho for lending, and Paxos-issued USDG as the dollar leg.

What arrived first was memecoins. CoinDesk measured the gap in July, when tokenised real-world assets on the chain were worth about $12.66M and the memecoin CASHCAT alone had peaked at roughly twelve times that.

$IF is on the memecoin side of that gap. This paper is not going to describe it as infrastructure.

## Two quirks worth knowing before you check anything

Both of these make honest data look like a mistake. If you go to the chain yourself and find a number that seems wrong, it is probably one of these two.

### `block.number` returns an Ethereum height

Inside a contract on this chain, `block.number` returns an Ethereum L1 block height, not the L2 height.

The $IF token records a launch block of `25,507,001`. The transaction that launched it actually sat in L2 block `6,657,668`. Neither figure is an error. They are counting different chains.

The consequence is that any window the token expresses "in blocks" is in L1 blocks of about twelve seconds, not L2 blocks of about a tenth of a second. The token's launch restriction was set to `366` blocks, which is about 73 minutes. Read as L2 blocks it would be a matter of seconds, and you would conclude the restriction had barely existed. It did exist, and [The launch](/docs/the-launch/) sets out precisely what it restricted while it was live.

### Several of the largest holders are wallets, not contracts

Some of the biggest $IF holders read as "contracts" on the explorer. They are people. They are EIP-7702 delegated wallets, which are ordinary accounts that have pointed themselves at smart-wallet code: Alchemy's `SemiModularAccount7702`, Uniswap's `CaliburEntry`, `CoinbaseSmartWallet`.

This matters for one specific thing. Concentration analysis should count them as people, because that is what they are. Treating them as protocol contracts or as some kind of treasury would misstate the distribution in the direction of making it look better organised than it is. The [holder table](/stats/) links every row to its address, so you can open one and see what it is rather than trusting the word next to it.

## The honest consequence of a new chain

A newer chain means fewer tools support it. Some portfolio trackers will not show your $IF balance, some explorers will not resolve the address, and some wallets need the network added by hand. That is a real inconvenience rather than a conspiracy, and it is the same point made on [The token](/docs/the-token/).

There is a sharper version of it too. Fewer tools also means fewer independent people looking, which is part of why this site reads its figures from the chain directly and links each one to the transaction it came from. The [stats page](/stats/) is where that lands.

## What this page does not tell you

It describes the chain. It does not vouch for it.

An L2's safety rests on its sequencer and its bridge, and neither has been reviewed for this paper. Nothing here is a statement that Robinhood Chain is secure, decentralised, or durable. It is a statement about what the chain is, what it measures at, and where to read it for yourself.
