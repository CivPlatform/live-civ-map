import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { useNavigate } from 'react-router'
import { atom, useRecoilState } from 'recoil'
import { useMobx } from '../model'
import { layerSlugFromUrl } from '../pages'
import { Bounds, xzFromLatLng } from './spatial'

export type CreatedFeatureType =
	| 'marker'
	| 'circle'
	| 'line'
	| 'polygon'
	| 'rectangle'
	| 'map_image'

export interface CreatedFeatureInfo {
	type: CreatedFeatureType
	layerUrl: string
}

const createdFeatureInfoRecoil = atom<CreatedFeatureInfo | null>({
	key: 'createdFeature',
	default: null,
})

export function useCreatedFeatureInfo() {
	return useRecoilState(createdFeatureInfoRecoil)
}

export const EditorCreator = observer(function EditorCreator() {
	const navigate = useNavigate()

	const [createdFeatureInfo, setCreatedFeatureInfo] = useCreatedFeatureInfo()

	const { type: createdFeatureType, layerUrl } = createdFeatureInfo || {}

	// XXX handle layer not loaded/no access
	const layer = useMobx().layerStates.getByUrl(layerUrl!)
	const createFeature = layer?.createFeature?.bind(layer)!
	const updateFeature = layer?.updateFeature?.bind(layer)!

	const map = useMap()

	useEffect(() => {
		const layerSlug = layerSlugFromUrl(layerUrl || '')
		switch (createdFeatureType) {
			case 'marker': {
				const tempMarker = map.editTools.startMarker()
				tempMarker.on('editable:drawing:commit', () => {
					const [x, z] = xzFromLatLng(tempMarker.getLatLng())
					const id = createFeature({ data: { x, z } })
					setCreatedFeatureInfo(null)
					navigate(`/layer/${layerSlug}/feature/${id}/edit`)
				})
				return () => {
					tempMarker.remove()
				}
			}
			case 'line': {
				let id: string | null = null
				const tempLine = map.editTools.startPolyline()
				tempLine.on('editable:drawing:clicked', () => {
					const lines = xzFromLatLng(tempLine.getLatLngs()) as any // XXX normalize nesting depth
					if (lines.flat(99).length >= 4) {
						if (!id) {
							id = createFeature({ data: { lines } })
							if (!id) return console.error('Must log in to create line')
						} else {
							updateFeature({ id, data: { lines } })
						}
					}
				})
				tempLine.on('editable:drawing:commit', () => {
					setCreatedFeatureInfo(null)
					navigate(`/layer/${layerSlug}/feature/${id}/edit`)
				})
				return () => {
					tempLine.remove()
				}
			}
			case 'polygon': {
				let id: string | null = null
				const tempPoly = map.editTools.startPolygon()
				tempPoly.on('editable:drawing:clicked', () => {
					const polygons = xzFromLatLng(tempPoly.getLatLngs()) as any // XXX normalize nesting depth
					if (polygons.flat(99).length >= 6) {
						if (!id) {
							id = createFeature({ data: { polygons } })
							if (!id) return console.error('Must log in to create polygon')
						} else {
							updateFeature({ id, data: { polygons } })
						}
					}
				})
				tempPoly.on('editable:drawing:commit', () => {
					setCreatedFeatureInfo(null)
					navigate(`/layer/${layerSlug}/feature/${id}/edit`)
				})
				return () => {
					tempPoly.remove()
				}
			}
			case 'rectangle': {
				const tempRect = map.editTools.startRectangle()
				tempRect.on('editable:drawing:commit', () => {
					const llbounds = tempRect.getBounds()
					const rectangle: Bounds = [
						[llbounds.getWest(), llbounds.getSouth()],
						[llbounds.getEast(), llbounds.getNorth()],
					]
					const id = createFeature({ data: { rectangle } })
					setCreatedFeatureInfo(null)
					navigate(`/layer/${layerSlug}/feature/${id}/edit`)
				})
				return () => {
					tempRect.remove()
				}
			}
			case 'map_image': {
				const tempRect = map.editTools.startRectangle()
				tempRect.on('editable:drawing:commit', () => {
					const llbounds = tempRect.getBounds()
					const bounds: Bounds = [
						[llbounds.getWest(), llbounds.getSouth()],
						[llbounds.getEast(), llbounds.getNorth()],
					]
					const url = prompt('Enter map image URL')
					if (url?.match(/^https?:\/\/.+\..+/)) {
						const id = createFeature({ data: { map_image: { bounds, url } } })
						navigate(`/layer/${layerSlug}/feature/${id}/edit`)
					} else {
						alert('Invalid image URL. No overlay created.')
					}
					setCreatedFeatureInfo(null)
				})
				return () => {
					tempRect.remove()
				}
			}
		}
	}, [layerUrl, map.editTools, createFeature, updateFeature, createdFeatureType, setCreatedFeatureInfo, navigate])

	return null
})
