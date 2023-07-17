import { MakeServicesPaginationResponse, Metadata } from './basic'

export type TokensByContractPackageHashResponse =
  MakeServicesPaginationResponse<TokenByContractPackageHash>
export interface TokenByContractPackageHash {
  tracking_id: string
  token_standard_id: number
  contract_package_hash: string
  token_id: string
  owner_account_hash: string
  metadata: Metadata[]
  is_burned: boolean
  timestamp: Date
  owner_public_key: string
}
