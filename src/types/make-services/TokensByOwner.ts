import { Metadata } from './basic'

export interface TokensByOwnerResponse {
  data: Token[]
  pageCount: number
  itemCount: number
  pages: Page[]
}

export interface Page {
  number: number
  url: string
}

export interface Token {
  tracking_id: string
  token_standard_id: number
  contract_package_hash: string
  token_id: string
  owner_account_hash: string
  metadata: Metadata[]
  is_burned: boolean
  contract_package: ContractPackage
  owner_public_key: string
}

export interface ContractPackage {
  contract_package_hash: string
  owner_public_key: string
  contract_type_id: number
  contract_name: null | string
  contract_description: null | string
  timestamp: Date
}
