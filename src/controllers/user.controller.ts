import express from 'express'

import catchAsync from '@/utils/catchAsync'

export const addToken = catchAsync(
  async (req: express.Request, res: express.Response) => {
    // const { contractPackageHash, tokenId } = req.body
    // const result = await tokenServices.addToken(contractPackageHash, tokenId)

    // const cep47Client = new CEP47Client(
    //   NEXT_PUBLIC_CASPER_NODE_ADDRESS!,
    //   NEXT_PUBLIC_CASPER_CHAIN_NAME!,
    // )
    // cep47Client.setContractHash(`hash-${contractHash}`)
    // const metadata = await cep47Client.getTokenMeta(tokenId)
    // const owner = (await cep47Client.getOwnerOf(tokenId)).slice(13)
    res.json()
  },
)
