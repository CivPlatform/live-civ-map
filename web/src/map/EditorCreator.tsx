import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { atom, useRecoilState } from 'recoil'
import { Layer } from './Layer'
import { useCreateFeature, useUpdateFeature } from './LayerState'
import { Bounds, xzFromLatLng } from './spatial'

export type CreatedFeatureType =
	| 'marker'
	| 'circle'
	| 'line'
	| 'polygon'
	| 'rectangle'
	| 'map_image'

export const createdFeatureTypeRecoil = atom<CreatedFeatureType | null>({
	key: 'createdFeature',
	default: null,
})

export function EditorCreator(props: { layer: Layer }) {
	const [createdFeatureType, setCreatedFeatureType] = useRecoilState(
		createdFeatureTypeRecoil
	)

	const createFeature = useCreateFeature(props.layer.url)

	const updateFeature = useUpdateFeature(props.layer.url)

	const map = useMap()

	useEffect(() => {
		switch (createdFeatureType) {
			case 'marker': {
				const tempMarker = map.editTools.startMarker()
				tempMarker.on('editable:drawing:commit', () => {
					const [x, z] = xzFromLatLng(tempMarker.getLatLng())
					createFeature({ data: { x, z } })
					setCreatedFeatureType(null)
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
					setCreatedFeatureType(null)
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
					setCreatedFeatureType(null)
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
					createFeature({ data: { rectangle } })
					setCreatedFeatureType(null)
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
						createFeature({ data: { map_image: { bounds, url } } })
					} else {
						alert('Invalid image url. No overlay created.')
					}
					setCreatedFeatureType(null)
				})
				return () => {
					tempRect.remove()
				}
			}
		}
	}, [
		map.editTools,
		createFeature,
		updateFeature,
		createdFeatureType,
		setCreatedFeatureType,
	])

	return null
}
