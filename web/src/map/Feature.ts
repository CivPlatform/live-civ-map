import { Bounds, XZ } from './spatial'

export interface Feature<G extends FeatureGeometry = FeatureGeometry> {
	/** should never be exposed to user */
	id: string
	geometry: G
	extra?: any
}

export type FeatureGeometry =
	| MarkerGeometry
	| CircleGeometry
	| RectCenterGeometry
	| RectBoundsGeometry
	| LinesGeometry
	| PolygonsGeometry
	| MapImageGeometry

export type MarkerGeometry = { x: number; z: number }
export type CircleGeometry = { x: number; z: number; radius: number }
export type RectCenterGeometry = { x: number; z: number; rect_size: number }
export type RectBoundsGeometry = { rectangle: Bounds }
export type LinesGeometry = { lines: XZ[][] }
export type PolygonsGeometry = { polygons: XZ[][] }
export type MapImageGeometry = { map_image: { url: string; bounds: Bounds } }
