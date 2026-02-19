import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useDebouncedValue } from '@/hooks'

const ITEMS_PER_PAGE = 12
const SEARCH_DEBOUNCE_MS = 300

interface UsePaginatedSearchOptions<T> {
  items: T[]
  filterFn: (item: T, query: string) => boolean
}

interface UsePaginatedSearchResult<T> {
  search: string
  page: number
  filteredItems: T[]
  paginatedItems: T[]
  pageCount: number
  totalFiltered: number
  start: number
  end: number
  handleSearchChange: (e: ChangeEvent<HTMLInputElement>) => void
  handleClearSearch: () => void
  handlePageChange: (_: ChangeEvent<unknown>, page: number) => void
}

const usePaginatedSearch = <T>({ items, filterFn }: UsePaginatedSearchOptions<T>): UsePaginatedSearchResult<T> => {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const filteredItems = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return items
    }
    const query = debouncedSearch.toLowerCase()
    return items.filter(item => filterFn(item, query))
  }, [items, debouncedSearch, filterFn])

  const pageCount = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)

  const paginatedItems = useMemo(() => {
    const offset = (page - 1) * ITEMS_PER_PAGE
    return filteredItems.slice(offset, offset + ITEMS_PER_PAGE)
  }, [filteredItems, page])

  const start = (page - 1) * ITEMS_PER_PAGE + 1
  const end = Math.min(page * ITEMS_PER_PAGE, filteredItems.length)

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearch('')
  }, [])

  const handlePageChange = useCallback((_: ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage)
  }, [])

  return {
    search,
    page,
    filteredItems,
    paginatedItems,
    pageCount,
    totalFiltered: filteredItems.length,
    start,
    end,
    handleSearchChange,
    handleClearSearch,
    handlePageChange
  }
}

export { usePaginatedSearch }
export type { UsePaginatedSearchOptions, UsePaginatedSearchResult }
