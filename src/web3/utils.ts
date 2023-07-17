/* eslint-disable no-await-in-loop */
import { CasperClient, CLPublicKey, Keys } from 'casper-js-sdk'
import * as fs from 'fs'
import find from 'lodash/find'

export const parseTokenMeta = (str: string): Array<[string, string]> =>
  str.split(',').map((s) => {
    const map = s.split(' ')
    return [map[0], map[1]]
  })

export const getBinary = (pathToBinary: string) => {
  return new Uint8Array(fs.readFileSync(pathToBinary, null).buffer)
}

export const sleep = (ms: number) => {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Returns a set ECC key pairs - one for each NCTL user account.
 * @param {String} pathToUsers - Path to NCTL user directories.
 * @return {Array} An array of assymmetric keys.
 */
export const getKeyPairOfUserSet = (pathToUsers: string) => {
  return [1, 2, 3, 4, 5].map((userID) => {
    return Keys.Ed25519.parseKeyFiles(
      `${pathToUsers}/user-${userID}/public_key.pem`,
      `${pathToUsers}/user-${userID}/secret_key.pem`,
    )
  })
}

export const getDeploy = async (NODE_URL: string, deployHash: string) => {
  const client = new CasperClient(NODE_URL)
  let i = 300
  while (i !== 0) {
    const [deploy, raw] = await client.getDeploy(deployHash)
    if (raw.execution_results.length !== 0) {
      // @ts-ignore
      if (raw.execution_results[0].result.Success) {
        return deploy
      }
      // @ts-ignore
      throw Error(
        `Contract execution: ${
          // @ts-ignore
          raw.execution_results[0].result.Failure.error_message
        }`,
      )
    } else {
      i--
      // eslint-disable-next-line no-await-in-loop
      await sleep(1000)
    }
  }
  throw Error(`Timeout after ${i}s. Something's wrong`)
}

interface AccountInfo {
  namedKeys: any
}

export const getAccountInfo = async (
  client: CasperClient,
  publicKey: CLPublicKey,
): Promise<AccountInfo> => {
  const accountHash = publicKey.toAccountHashStr()
  const stateRootHash = await client.nodeClient.getStateRootHash()
  const { Account: accountInfo } = await client.nodeClient.getBlockState(
    stateRootHash,
    accountHash,
    [],
  )

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return accountInfo!
}

export const getContractPackageHashFromContractHash = async (
  client: CasperClient,
  contractHash: string,
) => {
  const stateRootHash = await client.nodeClient.getStateRootHash()
  const { Contract } = await client.nodeClient.getBlockState(
    stateRootHash,
    `hash-${contractHash!}`,
    [],
  )
  return Contract!.contractPackageHash.slice(21)
}

export const getContractHashFromContractPackageHash = async (
  client: CasperClient,
  contractPackageHash: string,
) => {
  const stateRootHash = await client.nodeClient.getStateRootHash()
  const { ContractPackage } = await client.nodeClient.getBlockState(
    stateRootHash,
    `hash-${contractPackageHash!}`,
    [],
  )
  return ContractPackage!.versions.pop()!.contractHash.slice(9)
}

/**
 * Returns a value under an on-chain account's storage.
 * @param {CasperClient} client - JS SDK client for interacting with a node.
 * @param {Object} keyPair - Assymmetric keys of an on-chain account.
 * @param {String} namedKey - A named key associated with an on-chain account.
 * @return {String} On-chain account storage item value.
 */
export const getAccountNamedKeyValue = async (
  client: CasperClient,
  publicKey: CLPublicKey,
  namedKey: string,
): Promise<string> => {
  // Chain query: get account information.
  const accountInfo = await getAccountInfo(client, publicKey)

  // Get value of contract v1 named key.
  const { key: contractHash } = find(accountInfo.namedKeys, (i) => {
    return i.name === namedKey
  })

  return contractHash
}
