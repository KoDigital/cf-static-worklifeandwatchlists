import isbot from 'isbot'
import * as Cookie from './cookie'
import getUserData, { UserData } from './getUserData'
import generateUniqId from './uniqId'
import logPixel from './logPixel'
import { VersionPercentage } from '../types/search'

/** get random number between 1 and 100 (both inclusive) */
const getRandom = () => Math.floor(Math.random() * 100 + 1)

const isUserBot = (request: Request): boolean => {
    const url = new URL(request.url)
    return url.searchParams.get('isbot') === '1' || isbot(request.headers.get('user-agent'))
}

const isUserFromEurope = (request: Request): boolean => false // request.cf?.continent === 'EU'


const KO_PREFIX = 'ko'
const OLD_PREFIX = 'en'

const getLanguageFromPath = (path: string[]): string => {
    // url example - https://domain.com/{prefix}/{article-slug}

    // support new prefix - prefix contains language (koen, koes,...)
    if (path[0]?.length === (KO_PREFIX.length + 2) && path[0].startsWith(KO_PREFIX)) {
        return path[0].slice(-2)
    }

    // old prefix (e.g. /en) or failed to detect language from path
    return OLD_PREFIX
}

const getNextUrlWithPath = (url: URL, path: string[]): string => {
    return `${url.protocol}//${url.host}/${path.join('/')}/${url.search}`
}

const getNextUrl = (request: Request, versionName: string, userData: UserData): string => {
    const url = new URL(request.url)
    const path = url.pathname.split('/').filter(Boolean)
    const language = getLanguageFromPath(path)

    const isFromEurope = isUserFromEurope(request)
    const isBot = isUserBot(request)

    // android + 90% OR test param
    const isAndroid = url?.searchParams?.get('andtest') === '1'
    // || (
    //     userData?.os?.toLowerCase() === 'android' &&
    //     getRandom() <= 90
    // )

    let pathPostfix = ''
    if (isAndroid) {
        pathPostfix = '-and'
    }
    const articleName = path[1]
    if (isBot) return getNextUrlWithPath(url, [`${language}-no-ads${pathPostfix}`, articleName, versionName])
    if (isFromEurope) return getNextUrlWithPath(url, [`${language}-eu${pathPostfix}`, articleName, versionName])
    return getNextUrlWithPath(url, [`${language}${pathPostfix}`, articleName, versionName])
}

const getVersion = (versions: VersionPercentage[]): VersionPercentage => {
    // create a distribution array
    const distribution = Array.from(versions, (ver, index) => Array(ver.percentage).fill(index)).flat()
    // get random index
    const randomIndex = Math.floor(Math.random() * distribution.length)
    return versions[distribution[randomIndex]]
}

const adsnetRequest = (versions: VersionPercentage[]): PagesFunction => async (context) => {
    try {
        const { request } = context

        // headers contain special value
        if (request.headers.get('ko-redirected') === '1') return context.next()

        const currentVersion = getVersion(versions)
        const versionName = currentVersion?.versionName || '0'
        const versionPercentage = currentVersion?.percentage || 0

        const isBot = isUserBot(request)
        const userData = getUserData(request)

        const nextUrl = getNextUrl(request, versionName, userData)

        const sessionUniqId = Cookie.get(request.headers.get('cookie') || '', Cookie.SESSION_UNIQ_ID) || generateUniqId()
        try {
            await logPixel(request, 'is-func', sessionUniqId, new URL(request.url), nextUrl, versionName, versionPercentage)
        } catch (e) {}

        // set special header so next time this function respond without any logic
        const nextRequest = new Request(nextUrl, request)
        nextRequest.headers.set('ko-redirected', '1')
        const nextResponse = await fetch(nextRequest)

        // set response headers
        const response = new Response(nextResponse.body, nextResponse)
        response.headers.append('set-cookie', Cookie.set(Cookie.SESSION_IS_BOT_KEY, isBot ? '1' : '0'))
        response.headers.append('set-cookie', Cookie.set(Cookie.SESSION_START_SERVER_KEY, Math.round(new Date().getTime() / 1000).toString()))
        response.headers.append('set-cookie', Cookie.set(Cookie.SESSION_BROWSER, userData?.browser || ''))
        response.headers.append('set-cookie', Cookie.set(Cookie.USER_IP, userData?.user_ip || ''))
        response.headers.append('set-cookie', Cookie.set(Cookie.SESSION_UNIQ_ID, sessionUniqId))

        return response
    } catch (err) {
        try {
            await logPixel(context?.request, 'is-func-error', '', new URL(context?.request?.url), '', '', 0)
        } catch (e) {}
        return Response.redirect(new URL(context.request.url).origin)
    }
}

export default adsnetRequest
