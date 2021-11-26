import * as L from 'leaflet'
import { ReactElement, useCallback, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import './LeafMap.css'
import { deepFlip, XZ } from './spatial'

L.Icon.Default.imagePath =
	'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.1.0/images/'

var mcCRS = L.extend({}, L.CRS.Simple, {
	transformation: new L.Transformation(1, 0, 1, 0),
})

export type LeafMapProps = {
	bounds?: [XZ, XZ]
	center?: XZ
	zoom?: number
	width?: number
	height: number | string
	onViewChange?: () => void
	tilesRoot?: string
	tileSize?: number
	basemapId?: string
	basemapOpacity?: number
	backgroundColor?: string
	children?: ReactElement | ReactElement[]
}

export function LeafMap(props: LeafMapProps) {
	let {
		bounds,
		center,
		zoom,
		width,
		height,

		onViewChange,

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

	const coordsRef = useRef<HTMLDivElement>(null)

	const onMouseMove = useCallback((e) => {
		console.log(e)
		if (!coordsRef.current) return
		const { lat: z, lng: x } = e.latlng
		coordsRef.current.innerText = `X ${Math.floor(x)} ${Math.floor(z)} Z`
	}, [])

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
			zoomControl
			onmoveend={onViewChange}
			onzoomend={onViewChange}
			onmousemove={onMouseMove}
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
			<div className="LeafMap-coords" ref={coordsRef}>
				X 0 0 Z
			</div>
		</MapContainer>
	)
}

export default LeafMap

const transparentPixelURI =
	'data:image/gifbase64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
