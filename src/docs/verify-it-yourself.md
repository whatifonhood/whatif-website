---
title: Verify it yourself
summary: The exact commands behind every number, so you never have to take our word for one.
---

The landing page says _don't trust a website — including this one._ This is the page that makes that actionable.

Every figure on this site comes from a public, keyless, read-only call. Nothing below needs an account, an API key, or our permission. Paste any of it into a terminal.

The [stats page](/stats/) carries the same commands under a panel called **Check every number yourself**, generated from the same addresses the site itself uses — so they cannot drift into being wrong without the site being wrong in the same way.

## Is the supply really one billion?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x18160ddd"},"latest"]}'
```

`0x18160ddd` is the selector for `totalSupply()`. The answer comes back as hex wei — divide by 10^18. It should read exactly 1,000,000,000.

## Can anyone still change the contract?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x8da5cb5b"},"latest"]}'
```

`0x8da5cb5b` is `owner()`. This call **reverts** — `execution reverted` — because the function does not exist on this contract.

That is a stronger fact than a renouncement. A renounced contract had an owner and gave it up, which you have to trust was done properly. This one never had the function at all, and you have just proved it.

## How much has actually been burned?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x70a08231000000000000000000000000000000000000000000000000000000000000dEaD"},"latest"]}'
```

`0x70a08231` is `balanceOf`, followed by the burn address padded to 32 bytes. Hex wei again, divide by 10^18.

## Price, liquidity and volume

```
curl -s 'https://api.dexscreener.com/latest/dex/pairs/robinhood/0x39a200271525e9641e799127bdab299daef21953'
```

Price is at `pairs[0].priceUsd`, liquidity at `pairs[0].liquidity.usd`, and 24-hour volume at `pairs[0].volume.h24`.

## Holder count

```
curl -s 'https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1/info'
```

At `data.attributes.holders.count`.

## The largest holders

```
curl -s 'https://robinhoodchain.blockscout.com/api/v2/tokens/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1/holders'
```

## Did the launcher really take 11% in the launch transaction?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt",
       "params":["0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c"]}'
```

That hash is the launch. One transaction, eighteen logs, and everything that made $IF happened inside it. The log to read is number 14 in the list the node returns: a `Transfer` on the token contract, `from` the pool `0x39A200271525E9641e799127bdAB299DAeF21953`, `to` the deployer `0x84F8E5a324466Deb7447048C014CF0245ce04afA`. Its `data` field divided by 10^18 is 110,436,131.71 $IF, which is 11.04% of the supply, bought atomically before anyone else could trade.

The 2% wallet cap in force at the time did not apply, because the contract exempted the deployer by name. [The launch](/docs/the-launch/) walks the rest of the eighteen logs.

## Does the deployer still hold any?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x70a0823100000000000000000000000084F8E5a324466Deb7447048C014CF0245ce04afA"},"latest"]}'
```

`balanceOf` again, this time with the deployer's address. It returns zero. The deployer bought 674 $IF back at some point after the launch and moved it on again, and the balance has been zero since. That is a fact about one address and nothing more: a zero balance does not rule out other wallets, and nobody here has attempted to cluster them.

## Who holds the launch liquidity position?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt",
       "params":["0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c"]}'
```

The launch receipt again, read for a different thing. Logs 7 to 9 are where position NFT `70641` is minted. Logs 11 and 12 are where it moves: a `Transfer` of the NFT to NOXA's `LaunchLocker`, and the locker's own `PositionLocked` event. The `address` field of log 12 is the locker's address — take it from the chain rather than from us, then open it on the explorer.

To confirm it is still the holder today, ask the position manager — the contract that issued the NFT in logs 7 to 9 — for `ownerOf` of token `70641`, which is `0x113f1` in hex. The explorer's read tab will do it without a terminal. The position has been in the locker since the block it was created in.

## Can the locker ever let go of it?

Not through anything that has been published. Open the locker on the explorer — the address is in log 12 of the launch receipt above — and read its contract tab. There is no `transferFrom`, no `safeTransferFrom`, no `approve`, no `setApprovalForAll`, no `decreaseLiquidity` and no `burn`. The only thing anyone can call against the position is `collectFees`, which takes the accrued fees and leaves the principal where it is.

A function that is not there cannot be called, and that is a strong thing to be able to say. It is also the limit of what this check gives you. The locker's source is verified as a partial match, like the token's, so what you are reading is source that compiles to the deployed bytecode apart from its trailing metadata. It is published code, checked by you. It is not an audit, and nobody here has performed one.

This says nothing about the other half of the depth in the pool, which is ordinary LP and can leave in a single block. [Liquidity and the lock](/docs/liquidity-and-the-lock/) has that split.

## Does everything in the burn address come from one place?

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getLogs","params":[{
       "address":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",null,
                 "0x000000000000000000000000000000000000000000000000000000000000dEaD"],
       "fromBlock":"0x3135298","toBlock":"0x3235298"}]}'
```

That asks for every `Transfer` into the burn address over a fixed window of about a million blocks, which on this chain is a bit over a day. Read the second topic of each result, which is the sender. The address to look for is `0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417` — NOXA's fee contract, and the source of 423 of the 425 transfers ever made into the burn address. The other two are dust from ordinary wallets, 2.84 $IF between them.

Widen the window and the node will refuse you rather than answer, so the whole history has to be read in chunks. The [stats page](/stats/) has already done that and lists every burn with a link to its transaction. [How the burn works](/docs/how-the-burn-works/) explains what the fee contract is doing.

## Is the burn still taking 100% of the token side?

`protocolFeeShare` on the locker is the number that sets the split. Read it from the explorer's read tab on the locker, the same contract as the section above. It returns `100`.

That means all of the $IF swept out of the locked position goes to the protocol side, and the creator's on-chain share of the token leg is zero. What the fee contract then does with it — which since 12 July 2026 has been to burn every token of it — is that contract's own behaviour, and this number does not fix it. The fee contract's source has never been published, so that step cannot be read at all. It can only be watched.

Read it as a reading and not a promise. The locker's owner can change the number, and can change the address the protocol side is paid to, without asking anyone. If either changes, this is where you would see it first.

## If a number disagrees

Then the site is wrong and we would like to know. The chain is the source of truth; this website is a convenience laid over it.
