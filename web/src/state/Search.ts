import { atom, useRecoilState } from 'recoil'

const searchQueryRecoil = atom<string | undefined>({
	key: 'searchQuery',
	default: undefined,
})

export function useSearchQuery() {
	return useRecoilState(searchQueryRecoil)
}
