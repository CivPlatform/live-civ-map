import { Bounds, XZ } from './spatial'

export interface Feature {
	/** should never be exposed to user */
	id: string
	data: { [k: string]: any }
	creator_id: string
	created_ts: number
	last_editor_id: string
	last_edited_ts: number
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
