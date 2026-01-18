export const SESSION_AB_TEST_KEY = 'ko_abtest'
export const SESSION_IS_BOT_KEY = 'ko_isbot'
export const SESSION_ID_KEY = 'ko_sid'
export const SESSION_START_KEY = 'ko_stime'
export const SESSION_START_SERVER_KEY = 'ko_stime_s'
export const SESSION_BROWSER = 'ko_browser'
export const SESSION_UNIQ_ID = 'ko_uniq_id'
export const TABOOLA_CPC_VALUE = 'ko_taboola_cpc'
export const SKO_KEY = 'sko'
export const EDGAR_KEY = 'edgar'
export const USER_IP = 'ko_user_ip'

const SECONDS_IN_HOUR = 60 * 60 * 1000

export const get = (cookie: string, name: string) => {
    return cookie.split('; ').reduce((result, currentCookie) => {
        const parts = currentCookie.split('=')
        return parts[0] === name ? decodeURIComponent(parts[1]) : result
    }, '')
}

export const set = (name: string, value: string, ttlHours: number = 0.5) => {
    const expires = new Date(Date.now() + (ttlHours * SECONDS_IN_HOUR)).toUTCString()
    const cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/'
    return cookie
}
