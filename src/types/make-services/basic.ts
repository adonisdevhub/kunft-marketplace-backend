export interface MakeServicesPaginationResponse<T> {
  data: T[]
  pageCount: number
  itemCount: number
  pages: Page[]
}

export interface Page {
  number: number
  url: string
}

export interface Metadata {
  key: string
  value: string
}
