import { useCallback } from 'react'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Grid, Pagination, Typography } from '@mui/material'
import { useTranslation } from '@dcl/hooks'
import { SearchField } from '@/components/SearchField'
import type { Land } from '../../assets.types'
import { getLandPosition } from '../../assets.utils'
import { usePaginatedSearch } from '../../hooks'
import { LandCard } from '../LandCard'

const landFilterFn = (land: Land, query: string): boolean => {
  const nameMatch = land.name.toLowerCase().includes(query)
  const positionMatch = getLandPosition(land)?.toLowerCase().includes(query) ?? false
  const typeMatch = land.type.toLowerCase().includes(query)
  return nameMatch || positionMatch || typeMatch
}

interface LandsTabPanelProps {
  lands: Land[]
}

const LandsTabPanel: FC<LandsTabPanelProps> = ({ lands }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { search, page, paginatedItems, pageCount, totalFiltered, start, end, handleSearchChange, handleClearSearch, handlePageChange } =
    usePaginatedSearch({ items: lands, filterFn: landFilterFn })

  const handleLandClick = useCallback(
    (land: Land) => () => {
      const position = getLandPosition(land)
      if (position) {
        navigate(`/env?position=${position}`)
      }
    },
    [navigate]
  )

  return (
    <>
      <SearchField value={search} onChange={handleSearchChange} onClear={handleClearSearch} placeholder={t('select_page.search_lands')} />

      {lands.length === 0 ? (
        <Typography color="text.secondary">{t('select_page.no_lands')}</Typography>
      ) : totalFiltered === 0 ? (
        <Typography color="text.secondary">{t('select_page.no_search_results', { query: search })}</Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {paginatedItems.map(land => (
              <Grid item xs={12} sm={6} md={4} key={land.id}>
                <LandCard land={land} onClick={handleLandClick(land)} />
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

export { LandsTabPanel }
