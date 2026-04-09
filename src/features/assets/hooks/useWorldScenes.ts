import { useMemo } from 'react'
import { useGetWorldScenesQuery } from '../assets.client'
import type { WorldScene } from '../assets.types'

interface UseWorldScenesResult {
  scenes: WorldScene[]
  sceneCount: number
  firstScene: WorldScene | undefined
  isMultiScene: boolean
  isLoading: boolean
  isError: boolean
}

const useWorldScenes = (worldName: string): UseWorldScenesResult => {
  const { data: scenes, isLoading, isError } = useGetWorldScenesQuery({ worldName }, { skip: !worldName })

  return useMemo(
    () => ({
      scenes: scenes ?? [],
      sceneCount: scenes?.length ?? 0,
      firstScene: scenes?.[0],
      isMultiScene: (scenes?.length ?? 0) > 1,
      isLoading,
      isError
    }),
    [scenes, isLoading, isError]
  )
}

export { useWorldScenes }
export type { UseWorldScenesResult }
