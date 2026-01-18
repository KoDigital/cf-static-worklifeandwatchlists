import UAParser from 'ua-parser-js'

export interface UserData {
    country: string | null
    device: string | null
    os: string | null
    os_ver: string | null
    browser: string | null
    browser_ver: string | null
	user_ip: string | null
}

export default (request: Request): UserData => {
    try {
		const userAgent = request.headers.get('User-Agent') || ''
		const countryCode = request.headers.get('CF-IPCountry') || 'Unknown'
		const userIp = request.headers.get('CF-Connecting-IP') || ''
		const parser = new UAParser(userAgent)
		const { device, os, browser } = parser.getResult()

		const userConfig: UserData = {
			country: countryCode,
			device: (device?.type || 'desktop').toLowerCase(),
			os: (os?.name || '').toLowerCase(),
			os_ver: os?.version || 'unknown',
			browser: (browser?.name || '').replace(/mobile/ig, '').toLowerCase().trim(),
			browser_ver: browser?.major || browser?.version || 'unknown',
			user_ip: userIp
		}

		return userConfig
	} catch (err) {
		console.error('getUserData failed', err)
		return {
			country: 'unknown',
			device: 'unknown',
			os: 'unknown',
			os_ver: 'unknown',
			browser: 'unknown',
			browser_ver: 'unknown',
			user_ip: ''
		}
	}
}
