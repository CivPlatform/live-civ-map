export type XZ = [number, number]
export type Bounds = [XZ, XZ]

type LatLngObj = { lat: number; lng: number }

/** Leaflet expects `[z,x]` but Minecraft convention is `[x,z]` */
export function deepFlip<T extends XZ | XZ[] | XZ[][]>(positions: T): T {
	if (Array.isArray(positions[0]))
		return (positions as any).map((e: any) => deepFlip(e))
	return [positions[1], positions[0]] as any
}

export function intCoords(point: XZ | LatLngObj) {
	let x, z
	if (Array.isArray(point)) {
		;[x, z] = point
	} else {
		x = point.lng
		z = point.lat
	}
	return [Math.floor(x), Math.floor(z)]
}

/** get the bounds that encompass all given bounds */
export function getBoundsBounds(data: [XZ, XZ][]): [XZ, XZ] {
	const allX = data.map((d) => d[0][0]).concat(data.map((d) => d[1][0]))
	const allZ = data.map((d) => d[0][1]).concat(data.map((d) => d[1][1]))
	return [
		[Math.min(...allX), Math.min(...allZ)],
		[Math.max(...allX), Math.max(...allZ)],
	]
}
