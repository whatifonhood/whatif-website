---
title: 自己去验证
summary: 每个数字背后的确切命令，任何一个你都不必只听我们说。
---

首页写着 _不要相信任何网站 —— 包括这一个。_ 这一页把那句话变成可以动手做的事。

本站的每一个数字都来自公开的、无需密钥的只读调用。下面没有任何一条需要账号、API 密钥，或者我们的许可。把其中任意一条粘贴进终端即可。

[数据页](/zh/stats/)在一个叫 **自己核对每一个数字** 的面板下放着同样的命令，它们由本站自己使用的同一批地址生成 —— 所以除非本站以同样的方式出错，它们不可能漂移成错的。

## 供应量真的是十亿吗？

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x18160ddd"},"latest"]}'
```

`0x18160ddd` 是 `totalSupply()` 的选择器。返回值是十六进制的 wei —— 除以 10^18。结果应当正好是 1,000,000,000。

## 还有人能改动这个合约吗？

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x8da5cb5b"},"latest"]}'
```

`0x8da5cb5b` 是 `owner()`。这个调用会 **回滚** —— `execution reverted` —— 因为这个合约上并不存在这个函数。

这比放弃所有权是更强的事实。一个放弃了所有权的合约曾经有过所有者，然后把它交了出去，而那一步是否做得妥当，你只能选择相信。这个合约压根就没有过这个函数，而你刚刚亲手证明了这一点。

## 到底销毁了多少？

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x70a08231000000000000000000000000000000000000000000000000000000000000dEaD"},"latest"]}'
```

`0x70a08231` 是 `balanceOf`，后面跟着补齐到 32 字节的销毁地址。同样是十六进制的 wei，除以 10^18。

## 价格、流动性与成交量

```
curl -s 'https://api.dexscreener.com/latest/dex/pairs/robinhood/0x39a200271525e9641e799127bdab299daef21953'
```

价格在 `pairs[0].priceUsd`，流动性在 `pairs[0].liquidity.usd`，24 小时成交量在 `pairs[0].volume.h24`。

## 持有者数量

```
curl -s 'https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1/info'
```

在 `data.attributes.holders.count`。

## 最大的那些持有者

```
curl -s -A 'Mozilla/5.0' 'https://robinhoodchain.blockscout.com/api/v2/tokens/0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1/holders'
```

## 发行方真的在发行交易里拿走了 11% 吗？

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt",
       "params":["0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c"]}'
```

那个哈希就是发行本身。一笔交易，十八条日志，造就 $IF 的一切都发生在它里面。要读的是节点返回的列表里编号为 14 的日志（节点从 0 开始编号；从 1 开始计数的浏览器会把同一条显示为第 15 条）：代币合约上的一次 `Transfer`，`from` 是资金池 `0x39A200271525E9641e799127bdAB299DAeF21953`，`to` 是部署者 `0x84F8E5a324466Deb7447048C014CF0245ce04afA`。它的 `data` 字段除以 10^18 是 110,436,131.71 $IF，占供应量的 11.04%，在其他任何人能够交易之前就原子性地买进。

当时生效的 2% 钱包上限对它不适用，因为合约按名字豁免了部署者。[发行](/zh/docs/the-launch/)把这十八条日志中余下的部分逐条讲了一遍。

## 部署者现在还持有吗？

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "data":"0x70a0823100000000000000000000000084F8E5a324466Deb7447048C014CF0245ce04afA"},"latest"]}'
```

还是 `balanceOf`，这次填的是部署者的地址。它返回零。部署者在发行之后的某个时点买回过 674 $IF，随后又转了出去，此后余额一直是零。这只是关于一个地址的事实，仅此而已：余额为零并不能排除还有别的钱包，而这里没有人尝试过把它们聚类。

## 谁持有发行时的流动性头寸？

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt",
       "params":["0x008893650598c52ba959de3f82ad5b661c022a085ffcbf7db9b6234f6c3b287c"]}'
```

还是那张发行回执，只是读的是另一件事。第 7 至 9 条日志是头寸 NFT `70641` 被铸造的地方。第 11 和 12 条日志是它发生转移的地方：这枚 NFT 向 NOXA 的 `LaunchLocker` 的一次 `Transfer`，以及锁仓合约自己的 `PositionLocked` 事件。第 12 条日志的 `address` 字段就是锁仓合约的地址 —— 从链上取它，而不是从我们这里取，然后在区块浏览器上打开。

要确认它今天仍然是持有者，就去问头寸管理器 —— 也就是在第 7 至 9 条日志里发出这枚 NFT 的那个合约 —— 查询 token `70641` 的 `ownerOf`，`70641` 的十六进制是 `0x113f1`。区块浏览器的 read 标签页不用终端也能做到。这个头寸自它被创建的那个区块起，就一直在锁仓合约里。

## 锁仓合约有可能把它放出来吗？

就已经公开的东西而言，不能。在区块浏览器上打开锁仓合约 —— 地址在上面那张发行回执的第 12 条日志里 —— 读它的 contract 标签页。里面没有 `transferFrom`，没有 `safeTransferFrom`，没有 `approve`，没有 `setApprovalForAll`，没有 `decreaseLiquidity`，也没有 `burn`。任何人能针对这个头寸调用的只有 `collectFees`，它取走累积的手续费，把本金留在原处。

不存在的函数无法被调用，能这样说是一件很有分量的事。这也是这项检查所能给你的上限。锁仓合约的源码和代币的一样，验证结果是部分匹配，所以你读到的源码，除去尾部的元数据之外，编译出来与已部署的字节码一致。那是公开的代码，由你自己核对过。它不是一次审计，而这里没有人做过审计。

这一点对池子里另一半深度什么也没说，那一半是普通 LP，可以在一个区块之内就撤走。[流动性与锁仓](/zh/docs/liquidity-and-the-lock/)给出了这个拆分。

## 销毁地址里的东西都来自同一个地方吗？

```
curl -s -X POST https://rpc.mainnet.chain.robinhood.com \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getLogs","params":[{
       "address":"0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1",
       "topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",null,
                 "0x000000000000000000000000000000000000000000000000000000000000dEaD"],
       "fromBlock":"0x3135298","toBlock":"0x3235298"}]}'
```

它请求的是在一个大约一百万个区块的固定窗口内，每一笔转入销毁地址的 `Transfer`，这个窗口在这条链上是一天多一点。读每条结果的第二个 topic，那是发送方。要找的地址是 `0x9eFdC1A8e6E94f16A228e44f3025E1f346EE0417` —— NOXA 的手续费合约，也是有史以来转入销毁地址的 425 笔转账中 423 笔的来源。另外两笔是普通钱包来的粉尘，加起来 2.84 $IF。

把窗口放宽，节点会拒绝你而不是回答你，所以完整的历史只能分段来读。[数据页](/zh/stats/)已经做过这件事，它列出了每一次销毁，并附上对应交易的链接。[销毁是怎么运作的](/zh/docs/how-the-burn-works/)解释了这个手续费合约在做什么。

## 销毁还在拿走代币一侧的 100% 吗？

锁仓合约上的 `protocolFeeShare` 就是设定这个分成的数字。在区块浏览器上锁仓合约的 read 标签页里读它，和上一节是同一个合约。它返回 `100`。

这意味着从被锁头寸里扫出来的 $IF 全部归到协议一侧，创建者在代币这一腿上的链上份额是零。手续费合约拿到之后做什么 —— 自 2026 年 7 月 12 日起一直是把其中每一枚代币都销毁 —— 是那个合约自己的行为，这个数字并不能把它固定住。手续费合约的源码从未公开过，所以那一步根本无法被读取。它只能被看着。

把它当作一次读数，而不是一个承诺。锁仓合约的所有者可以改这个数字，也可以改协议一侧的收款地址，不需要问任何人。如果这两者中任何一个变了，这里就是你最先会看到的地方。

## 如果某个数字对不上

那就是本站错了，我们希望知道。链才是事实来源；这个网站只是铺在它上面的一层便利。
