// We cannot use encodeURIComponent because of double decoding issues
// (How is the browser/router supposed to know whether a URL has already been decoded?).
// We assume there are no $ in the URL, which allows us to use that to encode slashes.
// We also remove any leading wss protocol for nicer common URLs,
// but leave ws (insecure) intact, which should only occur as a special case for development anyway.

export function layerSlugFromUrl(url: string) {
	return url
		.replace(/^wss:\/\//, '')
		.replaceAll('/', '$')
		.replace(/[?#].*/, '')
}

export function layerUrlFromSlug(slug: string) {
	slug = slug.replaceAll('$', '/')
	slug = slug.match(/^(ws|http)s?:\/\/.*/) ? slug : 'wss://' + slug
	return slug
}

export const defaultLayerServer = 'wss://civmap.herokuapp.com/'

export const getLayerHostFromUrl = (layerUrl: string) => new URL(layerUrl).host
export const getLayerNameFromUrl = (layerUrl: string) =>
	new URL(layerUrl).pathname.substr(1).replace(/.json$/, '')
