import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { atom, useRecoilState } from 'recoil'
import { Feature } from './Feature'
import { Layer } from './Layer'
import { makeFeatureId, useUpdateFeature } from './LayerState'
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

	const updateFeature = useUpdateFeature(props.layer.url)

	const map = useMap()

	useEffect(() => {
		switch (createdFeatureType) {
			case 'marker': {
				const id = makeFeatureId()
				const tempMarker = map.editTools.startMarker()
				tempMarker.on('editable:drawing:commit', () => {
					const [x, z] = xzFromLatLng(tempMarker.getLatLng())
					updateFeature({ id, x, z })
					setCreatedFeatureType(null)
				})
				return () => {
					tempMarker.remove()
				}
			}
			case 'line': {
				const id = makeFeatureId()
				let feature: Feature = { id, lines: [] }
				const tempLine = map.editTools.startPolyline()
				tempLine.on('editable:drawing:clicked', () => {
					const lines = xzFromLatLng(tempLine.getLatLngs()) as any // XXX normalize nesting depth
					if (lines.flat(99).length >= 4) {
						feature = updateFeature({ ...feature, lines })
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
				let feature: Feature = { id: makeFeatureId(), polygons: [] }
				const tempPoly = map.editTools.startPolygon()
				tempPoly.on('editable:drawing:clicked', () => {
					const polygons = xzFromLatLng(tempPoly.getLatLngs()) as any // XXX normalize nesting depth
					if (polygons.flat(99).length >= 6) {
						updateFeature({ ...feature, polygons })
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
				const id = makeFeatureId()
				const tempRect = map.editTools.startRectangle()
				tempRect.on('editable:drawing:commit', () => {
					const llbounds = tempRect.getBounds()
					const rectangle: Bounds = [
						[llbounds.getWest(), llbounds.getSouth()],
						[llbounds.getEast(), llbounds.getNorth()],
					]
					updateFeature({ id, rectangle })
					setCreatedFeatureType(null)
				})
				return () => {
					tempRect.remove()
				}
			}
			case 'map_image': {
				const id = makeFeatureId()
				const tempRect = map.editTools.startRectangle()
				tempRect.on('editable:drawing:commit', () => {
					const llbounds = tempRect.getBounds()
					const bounds: Bounds = [
						[llbounds.getWest(), llbounds.getSouth()],
						[llbounds.getEast(), llbounds.getNorth()],
					]
					let url
					do {
						url = prompt('Enter map image URL')
					} while (!url?.match(/^https?:\/\/.+\..+/))
					updateFeature({ id, map_image: { bounds, url } })
					setCreatedFeatureType(null)
				})
				return () => {
					tempRect.remove()
				}
			}
		}
	}, [map.editTools, updateFeature, createdFeatureType, setCreatedFeatureType])

	return null
}
