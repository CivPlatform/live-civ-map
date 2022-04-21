import ColorHash from 'color-hash'

const colorHash = new ColorHash()
export const getDefaultLayerColor = (layerUrl: string) =>
	colorHash.hex(layerUrl)
