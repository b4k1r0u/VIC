/**
 * @fileoverview useMapData — hook for loading and reactive map data access.
 * Syncs layer switching with automatic data refetch.
 */
import { useEffect, useCallback } from 'react'
import useMapStore from '../store/mapStore'

export function useMapData() {
  const {
    communeData,
    hotspots,
    portfolioKPIs,
    isLoading,
    error,
    selectedZone,
    selectedWilaya,
    selectedCommune,
    activeLayer,
    fetchMapData,
    fetchHotspots,
    fetchPortfolioKPIs,
    setSelectedWilaya,
    setSelectedCommune,
    setSelectedZone,
    setActiveLayer,
  } = useMapStore()

  // Refetch map features whenever the active layer changes
  useEffect(() => {
    fetchMapData()
  }, [activeLayer]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load KPIs + hotspots once on mount
  useEffect(() => {
    fetchHotspots()
    fetchPortfolioKPIs()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const switchLayer = useCallback(
    (layer) => setActiveLayer(layer),
    [setActiveLayer]
  )

  /** Handler for Leaflet commune click events */
  const handleCommuneClick = useCallback(
    (wilayaCode, communeCode) => {
      setSelectedWilaya(wilayaCode)
      setSelectedCommune(communeCode)
    },
    [setSelectedWilaya, setSelectedCommune]
  )

  return {
    communeData,
    hotspots,
    portfolioKPIs,
    isLoading,
    error,
    selectedZone,
    selectedWilaya,
    selectedCommune,
    activeLayer,
    switchLayer,
    handleCommuneClick,
    setSelectedZone,
    refetch: fetchMapData,
  }
}
