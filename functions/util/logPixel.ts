import getUniqId from './uniqId'

const logPixel = async (
    request: Request,
    action: string,
    uniqId: string,
    url: URL,
    newUrl: string,
    versionName: string,
    versionPercentage: number,
) => {
    try {
        const data = {
            uniq_id: uniqId,
            ab_ver: versionName,
            ab_perc: (versionPercentage || 0).toString(),
            event_time: Math.round(new Date().getTime() / 1000).toString(),
            custom3: action,
            custom4: url.host,
            custom5: url.pathname,
            custom17: newUrl,
        }
        const query = new URLSearchParams({ ...data, uid: getUniqId() })
        const logUrl = `https://static-search.amani.media/logs?${query.toString()}`
        await fetch(new Request(logUrl, request))
    } catch (err) {
        console.error('Failed to send log pixel', err)
    }
}

export default logPixel
