import { useCallback } from 'react'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Pagination, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { SearchField } from '@/components/SearchField'
import type { World } from '../../assets.types'
import { usePaginatedSearch } from '../../hooks'
import { WorldCard } from '../WorldCard'

const worldFilterFn = (world: World, query: string): boolean => world.name.toLowerCase().includes(query)

interface WorldsTabPanelProps {
  worlds: World[]
}

const WorldsTabPanel: FC<WorldsTabPanelProps> = ({ worlds }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { search, page, paginatedItems, pageCount, totalFiltered, start, end, handleSearchChange, handleClearSearch, handlePageChange } =
    usePaginatedSearch({ items: worlds, filterFn: worldFilterFn })

  const handleEditClick = useCallback(
    (worldName: string, position?: string) => {
      const params = new URLSearchParams({ realm: worldName })
      if (position) params.set('position', position)
      navigate(`/env?${params.toString()}`)
    },
    [navigate]
  )

  return (
    <>
      <SearchField value={search} onChange={handleSearchChange} onClear={handleClearSearch} placeholder={t('select_page.search_worlds')} />

      {worlds.length === 0 ? (
        <Typography color="text.secondary">{t('select_page.no_worlds')}</Typography>
      ) : totalFiltered === 0 ? (
        <Typography color="text.secondary">{t('select_page.no_search_results', { query: search })}</Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedItems.map(world => (
              <Grid item xs={12} sm={6} md={4} key={world.name}>
                <WorldCard world={world} onEditClick={handleEditClick} />
              </Grid>
            ))}
          </Grid>

          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t('select_page.showing_results', {
                  start: String(start),
                  end: String(end),
                  total: String(totalFiltered)
                })}
              </Typography>
              <Pagination count={pageCount} page={page} onChange={handlePageChange} size="small" shape="rounded" />
            </Box>
          )}
        </>
      )}
    </>
  )
}

export { WorldsTabPanel }
