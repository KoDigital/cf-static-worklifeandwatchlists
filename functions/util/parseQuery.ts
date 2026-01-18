
export default (query: string): Record<string, string> => {
    const result: Record<string, string> = {}
    const keyValues = query ? (query[0] === '?' ? query.slice(1) : query).split('&') : []
    for (const keyValue of keyValues) {
        const [key, value] = keyValue.split('=')
        result[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
    return result
}
