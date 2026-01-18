import isbot from 'isbot'
import * as Cookie from './util/cookie'
import * as Taboola from './util/taboola'

import getUserData, { UserData } from './util/getUserData'

const staticFilesSet = new Set([
    'ads.txt',
    'ccpa',
    'rss.xml',
    'rss_slideshow.xml'
])

const isUserBot = (request: Request): boolean => {
    const url = new URL(request.url)
    return url.searchParams.get('isbot') === '1' || isbot(request.headers.get('user-agent'))
}

const isUserFromEurope = (request: Request): boolean => false // request.cf?.continent === 'EU'

/** get random number between 1 and 100 (both inclusive) */
const getRandom = () => Math.floor(Math.random() * 100 + 1)

const KO_PREFIX = 'ko'
const OLD_PREFIX = 'en'

const getPrefixFromPath = (path: string[]): { prefix: string, language: string } => {
    // no prefix support - for root articles
    if (path.length === 1) {
        return { prefix: '', language: 'en' }
    }
    // support links with prefix - https://domain.com/{prefix}/{article-slug}
    if (path.length === 2) {
        const prefixPath = path[0]

        // support new prefix - prefix contains language (koen, koes,...)
        if (prefixPath?.length === (KO_PREFIX.length + 2) && prefixPath.startsWith(KO_PREFIX)) {
            return {
                prefix: prefixPath,
                language: prefixPath.slice(-2),
            }
        }

        // support old prefix - for article from en folders
        if (prefixPath === OLD_PREFIX) {
            return {
                prefix: prefixPath,
                language: 'en',
            }
        }
    }
}

const isStaticPath = (path: string[]): boolean => staticFilesSet.has(path[1])

const getNextUrlWithPath = (url: URL, path: string[], isStatic = false): string => {
    return `${url.protocol}//${url.host}/${path.join('/')}${isStatic ? '' : '/'}${url.search}`
}

const getNextStaticUrl = (url: URL, path: string[]): string => {
    const nextPath = path.slice(1) // remove prefix from path
    return getNextUrlWithPath(url, nextPath, true)
}

const getNextUrl = (request: Request, path: string[], userData: UserData): string => {
    const url = new URL(request.url)
    const prefixParams = getPrefixFromPath(path)

    const isFromEurope = isUserFromEurope(request)
    const isBot = isUserBot(request)

    const isAndroid = url?.searchParams?.get('andtest') === '1' || (
        ['android', 'ios'].includes(userData?.os?.toLowerCase()) &&
        getRandom() <= 95
    )

    // static files
    if (isStaticPath(path)) return getNextStaticUrl(url, path)

    // links with prefix - get articles from directories: {lang}, {lang}-eu, {lang}-no-ads
    if (prefixParams?.prefix) {
        const { language } = prefixParams
        const nextPath = path.slice(1) // remove prefix from path
        let pathPostfix = ''
        if (isAndroid) {
            pathPostfix = '-and'
        }
        if (isBot) return getNextUrlWithPath(url, [`${language}-no-ads${pathPostfix}`, ...nextPath])
        if (isFromEurope) return getNextUrlWithPath(url, [`${language}-eu${pathPostfix}`, ...nextPath])
        return getNextUrlWithPath(url, [`${language}${pathPostfix}`, ...nextPath])
    }

    // no-prefix links - get articles from directories: root, eu, no-ads
    if (isBot) return getNextUrlWithPath(url, ['no-ads', ...path])
    if (isFromEurope) return getNextUrlWithPath(url, ['eu', ...path])
    return getNextUrlWithPath(url, [...path])
}

const getTaboolaCPCvalue = (request: Request): number => {
    try {
        const utmCPC = new URL(request.url).searchParams?.get('utm_cpc')
        return Taboola.decryptCPC(utmCPC) || 0
    } catch (err) {
        console.error('Failed to get cpc value', err)
        return -1
    }
}

export const onRequest: PagesFunction = async (context) => {
    const {
        request,
        params,
        next,
    } = context

    const path = params.path as string[]
    const url = new URL(request.url)

    try {
        // headers containt special value
        if (request.headers.get('ko-redirected') === '1') return next()
        // no path
        if (!path?.length) return next()
        // path starts with /functions -> redirect to home page
        if (path[0] === 'functions') return Response.redirect(url.origin)

        const prefixParams = getPrefixFromPath(path)
        // non-article paths
        if (!prefixParams) return next()

        const isBot = isUserBot(request)
        const userData = getUserData(request)

        const nextUrl = getNextUrl(request, path, userData)

        // set special header so next time this function respond without any logic
        const nextRequest = new Request(nextUrl, request)
        nextRequest.headers.set('ko-redirected', '1')
        const nextResponse = await fetch(nextRequest)

        // set response headers
        const response = new Response(nextResponse.body, nextResponse)
        response.headers.append('set-cookie', Cookie.set(Cookie.SESSION_IS_BOT_KEY, isBot ? '1' : '0'))
        response.headers.append('set-cookie', Cookie.set(Cookie.SESSION_START_SERVER_KEY, Math.round(new Date().getTime() / 1000).toString()))
        response.headers.append('set-cookie', Cookie.set(Cookie.SESSION_BROWSER, userData?.browser || ''))
        response.headers.append('set-cookie', Cookie.set(Cookie.TABOOLA_CPC_VALUE, getTaboolaCPCvalue(request).toString()))

        return response
    } catch (err) {
        return Response.redirect(url.origin)
    }
}
