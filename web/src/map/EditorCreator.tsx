import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { xzFromLatLng } from './spatial'

export function EditorCreator(props: {
	createdFeatureType: string | null
	setCreatedFeatureType: (state: string | null) => void
}) {
	const { createdFeatureType, setCreatedFeatureType } = props

	const map = useMap()

	useEffect(() => {
		switch (createdFeatureType) {
			case 'marker': {
				const tempMarker = map.editTools.startMarker()
				tempMarker.on('editable:drawing:commit', () => {
					const [x, z] = xzFromLatLng(tempMarker.getLatLng())
					console.log('create marker:', { x, z }) // XXX to storage
					setCreatedFeatureType(null)
				})
				return () => {
					tempMarker.remove()
				}
			}
			case 'line': {
				const tempLine = map.editTools.startPolyline()
				tempLine.on('editable:drawing:commit', () => {
					const lines = xzFromLatLng(tempLine.getLatLngs())
					// TODO normalize nesting depth
					console.log('create line:', { lines }) // XXX to storage
					setCreatedFeatureType(null)
				})
				return () => {
					tempLine.remove()
				}
			}
			case 'polygon': {
				const tempPoly = map.editTools.startPolygon()
				tempPoly.on('editable:drawing:commit', () => {
					const polygons = xzFromLatLng(tempPoly.getLatLngs())
					// TODO normalize nesting depth
					console.log('create poly:', { polygons }) // XXX to storage
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
					const bounds = [
						[llbounds.getWest(), llbounds.getSouth()],
						[llbounds.getEast(), llbounds.getNorth()],
					]
					console.log('create rect:', { bounds }) // XXX to storage
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
					const bounds = [
						[llbounds.getWest(), llbounds.getSouth()],
						[llbounds.getEast(), llbounds.getNorth()],
					]
					let url
					do {
						url = prompt('Enter map image URL')
					} while (!url?.match(/^https?:\/\/.+\..+/))
					console.log('create map_image:', { map_image: { bounds, url } }) // XXX to storage
					setCreatedFeatureType(null)
				})
				return () => {
					tempRect.remove()
				}
			}
		}
	}, [map.editTools, createdFeatureType, setCreatedFeatureType])

	return null
}
