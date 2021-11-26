import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRef } from 'react'
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import './LeafMap.css'
import { deepFlip, XZ } from './spatial'

L.Icon.Default.imagePath =
	'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/'

var mcCRS = L.extend({}, L.CRS.Simple, {
	transformation: new L.Transformation(1, 0, 1, 0),
})

export type LeafMapProps = {
	bounds?: [XZ, XZ]
	center?: XZ
	zoom?: number
	width?: number
	height: number | string
	tilesRoot?: string
	tileSize?: number
	basemapId?: string
	basemapOpacity?: number
	backgroundColor?: string
	children?: React.ReactNode
}

export function LeafMap(props: LeafMapProps) {
	let {
		bounds,
		center,
		zoom,
		width,
		height,

		tilesRoot = 'https://ccmap.github.io/tiles/',
		tileSize = 256,
		basemapId = 'terrain',
		basemapOpacity = 1,
		backgroundColor = 'black',

		children,
	} = props

	if (!bounds && (!center || !zoom)) {
		center = [0, 0]
		zoom = -6
	}

	return (
		<MapContainer
			className="LeafMap"
			crs={mcCRS}
			style={{ width, height, backgroundColor }}
			bounds={bounds && deepFlip(bounds)}
			center={center && deepFlip(center)}
			zoom={zoom}
			maxZoom={5}
			minZoom={-6}
			zoomSnap={0}
			attributionControl={false}
			zoomControl={false}
		>
			<TileLayer
				noWrap
				url={tilesRoot + basemapId + '/z{z}/{x},{y}.png'}
				tileSize={tileSize}
				minZoom={-6}
				maxNativeZoom={0}
				errorTileUrl={transparentPixelURI}
				opacity={basemapOpacity}
			/>
			{children}
			<MapCoords />
		</MapContainer>
	)
}

export default LeafMap

function MapCoords() {
	const coordsRef = useRef<HTMLDivElement>(null)

	const updateCoords = (e: L.LeafletMouseEvent) => {
		if (!coordsRef.current) return
		const { lat: z, lng: x } = e.latlng
		coordsRef.current.innerText = `X ${Math.floor(x)} ${Math.floor(z)} Z`
	}

	useMapEvents({
		click: updateCoords,
		mousemove: updateCoords,
	})

	return (
		<div className="LeafMap-coords" ref={coordsRef}>
			Click to show coords
		</div>
	)
}

const transparentPixelURI =
	'data:image/gifbase64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
