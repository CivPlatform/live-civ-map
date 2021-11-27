import useLocalStorage from '@rehooks/local-storage'

/** stored to remember known layers in the client's map */
export type Layer = { url: string; hidden?: boolean }

export function useLayers(): [Layer[], (newValue: Layer[]) => void] {
	let [layers, setLayers] = useLocalStorage<Layer[]>('LiveCivMap:layers')
	if (!layers) layers = []
	return [layers, setLayers]
}
