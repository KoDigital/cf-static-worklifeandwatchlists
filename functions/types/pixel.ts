export interface StatisticRequest {
    article_name: string
    utm_campaign: string
    utm_source: string
    utm_medium: string
    utm_content: string
    utm_term: string
    site_code: string
    layout_num: number
    session_id: string
    session_start: string
    country: string
    device: string
    os: string
    os_ver: string
    browser: string
    browser_ver: string
    page: number
    conversion_event: string
    fbclick: string
    player: string
    conn_type: string
    conn_save_data: string
    core_count: number
    ram_gb: number
    screen_size: string
    ab_test: string
    bot: string
}

export interface UserData {
    country: string
    device: string
    os: string
    browser: string
    osVersion: string
    browserVersion: string
}
