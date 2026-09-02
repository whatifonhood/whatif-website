---
title: Wallets and custody
summary: Holding it yourself, and the specific ways people are separated from it.
---

Self-custody means the tokens are yours and the responsibility is too. There is no password reset and no support desk that can reverse a mistake.

## The recovery phrase

Twelve or twenty-four words, generated once when the wallet is created. They _are_ the wallet — anyone holding them can recreate it on any device and take everything.

Write them on paper. Store the paper somewhere you would store a passport.

Do not put them in a screenshot, a notes app, a password manager entry, a cloud drive, an email to yourself, or a message anywhere. Malware looks for exactly those, and phone backups sync them to places you did not intend.

**Nobody legitimate will ever ask for them.** Not us, not a wallet's support, not a moderator, not an airdrop, not a verification step. Every single request for a recovery phrase is theft in progress, without exception.

## The scams that actually work

Not the obvious ones. These:

**The fake token.** A contract with our name, our logo, our ticker, and one different character in the address. Buying it sends your money to a stranger. This is why [How to buy](/docs/how-to-buy/) tells you to check the last six characters, not just the first.

**Address poisoning.** Someone sends a worthless transaction from an address that closely resembles one you have used. Later you copy it from your own history and send funds to them. Never copy an address out of your transaction history — copy it from the source.

**The support DM.** You post a problem publicly, and a helpful account messages you within minutes. Real support does not arrive unprompted in your DMs.

**The wallet drainer.** A site asks you to connect and sign something to "claim", "verify" or "migrate". The signature grants permission to move your tokens. Read what you are signing; if it does not say plainly what it does, reject it.

## Why this site never asks you to connect

No page here asks for a wallet connection, a signature, or an approval. Not once.

That is a deliberate design constraint, not a feature we have not built yet. The [wallet lookup](/holdings/) reads any address you paste straight from the chain — a public read needs no permission from you, so asking for one would be theatre.

It also gives you a rule you can use elsewhere: **if something claiming to be us asks you to connect a wallet, it is not us.** That promise is only useful if we never break it, so we never will.

## Approvals

Swapping usually requires approving the token for a router contract. That approval persists after the trade.

Reviewing and revoking old approvals occasionally is good practice, especially any granted to a site you no longer use or no longer trust.
