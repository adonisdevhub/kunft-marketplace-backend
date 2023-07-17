import { Sale } from '@/models'

export async function onTokenListed(
  creator: string,
  token: any,
  startTime: string,
  price: string,
  deployHash: string,
  payToken?: string,
) {
  await Sale.findOneAndUpdate(
    {
      creator,
      token,
      startTime,
    },
    {
      creator,
      token,
      payToken,
      price,
      pendingDeployHash: deployHash,
      startTime: startTime,
      status: 'pending',
    },
    { upsert: true },
  )
}

export async function onCancelListing(
  creator: string,
  token: any,
  startTime: string,
  deployHash: string,
) {
  await Sale.findOneAndUpdate(
    {
      creator,
      token,
      startTime,
    },
    { status: 'canceled', canceledDeployHash: deployHash },
  )
}

export async function onBuyListedToken(
  creator: string,
  token: any,
  startTime: string,
  buyer: string,
  deployHash: string,
  additionalRecipient?: string,
) {
  await Sale.findOneAndUpdate(
    {
      creator,
      token,
      startTime,
    },
    {
      buyer,
      additionalRecipient,
      status: 'succeed',
      succeedDeployHash: deployHash,
    },
  )
  token.owner = additionalRecipient || buyer
  await token.save()
}
