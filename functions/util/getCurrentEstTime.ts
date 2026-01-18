
export default () => {
    const dt = new Date()

    // convert user's timezone to GMT
    dt.setTime(dt.getTime() + dt.getTimezoneOffset() * 60 * 1000)

    // convert GMT to EST
    const estOffset = -300
    const estDate = new Date(dt.getTime() + estOffset * 60 * 1000)
    return estDate
}
