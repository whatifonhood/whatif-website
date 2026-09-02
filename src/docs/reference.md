---
title: Reference
summary: Addresses, links, and the words this paper uses.
---

Everything on one page, for copying and for checking.

## Addresses

| What                         | Address                                      |
| ---------------------------- | -------------------------------------------- |
| $IF contract                 | `0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1` |
| IF/WETH pool, Uniswap V3, 1% | `0x39A200271525E9641e799127bdAB299DAeF21953` |
| Burn address                 | `0x000000000000000000000000000000000000dEaD` |

The contract address is the one that matters. Check the last six characters against this page or the explorer before you buy anything — see [How to buy](/docs/how-to-buy/).

The IF/WETH 1% pool is the main pool — created in the launch transaction, and the one the locked position sits in. It is not the only pool; the rest are listed on [Liquidity and the lock](/docs/liquidity-and-the-lock/).

## The launch and the lock

| What                          | Value                                                                |
| ----------------------------- | -------------------------------------------------------------------- |
| Launch transaction            | `0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c` |
| Launch block, L2              | `6657668`, 11 July 2026, 04:32:42 UTC                                |
| Launch liquidity position     | Uniswap V3 NFT `70641`, ticks `[-887200, 204200]`                    |
| Holder of NFT `70641`         | NOXA's `LaunchLocker`, per logs 11 and 12 of the launch transaction  |
| Deployer, who sent the launch | `0x84F8E5a324466Deb7447048C014CF0245ce04afA`                         |

Position `70641` is the permanently locked one. [The launch](/docs/the-launch/) reads the transaction log by log; [Liquidity and the lock](/docs/liquidity-and-the-lock/) says what the lock does and does not cover.

## NOXA's contracts

NOXA is the launchpad that stamped out the token and still operates the burn. Who controls these addresses is not established by any source we have reviewed: the locker's owner is a bare wallet, and the fee contract is unverified bytecode deployed by it.

| What                                                         | Address                                      |
| ------------------------------------------------------------ | -------------------------------------------- |
| Fee contract, which every burn has come from                 | `0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417` |
| Original fee wallet, paid the 20% $IF cut on 11–12 July 2026 | `0x71f2F1c2dc94cDaBFE29Cb355119f8683AE0969b` |
| Owner of the `LaunchLocker`                                  | `0x7E035Fb048a31e0481b88074557415b1C187242B` |

[How the burn works](/docs/how-the-burn-works/) explains what each of them does in the mechanism.

## The token

|                |                          |
| -------------- | ------------------------ |
| Name, on-chain | `What If`                |
| Symbol         | `IF`                     |
| Chain          | Robinhood Chain          |
| Standard       | ERC-20                   |
| Total supply   | 1,000,000,000, fixed     |
| Decimals       | 18                       |
| Contract name  | `LaunchToken`            |
| Compiler       | Solidity 0.8.30          |
| Owner function | none — `owner()` reverts |

The contract's own `name` and `symbol` are `What If` and `IF`. This paper writes them as What $IF and $IF, which is the ticker convention rather than a different token. The explorer will show you the first pair.

## The chain

|            |                                           |
| ---------- | ----------------------------------------- |
| Network    | Robinhood Chain                           |
| Chain ID   | `4663` (`0x1237`)                         |
| Gas token  | ETH                                       |
| Public RPC | `https://rpc.mainnet.chain.robinhood.com` |
| Explorer   | `https://robinhoodchain.blockscout.com`   |

[Verify it yourself](/docs/verify-it-yourself/) shows the calls you can make against that RPC; [The chain](/docs/the-chain/) covers what running on an L2 means for you.

## Where to look

- **Block explorer** — [robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com/token/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1)
- **Trade** — [Uniswap](https://app.uniswap.org/swap?outputCurrency=0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1&chain=robinhood)
- **Charts** — [DexScreener](https://dexscreener.com/robinhood/0x39a200271525e9641e799127bdab299daef21953)
- **This site** — [whatifonhood.com](https://whatifonhood.com)

## The only accounts that are us

- **X** — [@WhatIFonHOOD](https://x.com/WhatIFonHOOD)
- **Telegram** — [t.me/WhatIFonHoodChain](https://t.me/WhatIFonHoodChain)

Anything else is not us. We will never DM you first, never ask for a recovery phrase, and never ask you to connect a wallet.

## Glossary

**Burn** — sending tokens to an address nobody can spend from, permanently removing them from circulation.

**Contract address** — the token's unique identity on the chain. The only reliable way to tell a real token from a copy with the same name.

**Gas** — the fee paid in a chain's native token to have a transaction included. Without it, nothing goes through.

**Liquidity pool** — a contract holding two tokens that people trade against. Its balance is what lets you buy or sell.

**Market cap** — price multiplied by supply. A derived figure, not money that exists anywhere.

**Recovery phrase** — the words that _are_ your wallet. Anyone holding them owns everything in it.

**Self-custody** — holding your own keys, with no company able to freeze, reverse or restore anything.

**Slippage** — the difference between the price you saw and the price you got, caused by the market moving as your trade executes.

**Total supply** — every token that exists. Fixed here, and checkable with one call.

## Reading this paper offline

Every page is plain HTML with no scripts required to read it. Print or save any of them; nothing is behind a login and nothing loads from a third party.
