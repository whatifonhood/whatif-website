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
       "data":"0x70a0823100000000000000000000000000000000000000000000000000000000000 0dead"},"latest"]}'
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

## If a number disagrees

Then the site is wrong and we would like to know. The chain is the source of truth; this website is a convenience laid over it.
