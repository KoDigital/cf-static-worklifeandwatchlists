import generateSessionId from './uniqId'
import * as Cookie from './cookie'
import parseQuery from './parseQuery'
import getCurrentEstTime from './getCurrentEstTime'

export default (request: Request) => {
    const url = new URL(request.url)
    const query = parseQuery(url.search)
    const utmMedium = query.utm_medium

    const cookies = request.headers.get('cookie') || ''

    // get session values from cookies
    const [cookieSessionId, cookieUtmMedium] = (Cookie.get(cookies, Cookie.SESSION_ID_KEY) || '').split('_')
    const cookieSessionStart = Cookie.get(cookies, Cookie.SESSION_START_KEY)

    let sessionId = `${cookieSessionId}_${utmMedium}`
    let sessionStart = cookieSessionStart

    // refresh session if needed
    if (!cookieSessionId || !cookieSessionStart || cookieUtmMedium !== utmMedium) {
        sessionId = `${generateSessionId()}_${utmMedium}`
        sessionStart = Math.round(getCurrentEstTime().getTime() / 1000).toString()
    }

    return { sessionId, sessionStart }
}
