export interface Station {
    id: number;
    ids: number;
    newID: string;
    shopName: string;
    shopAddress: string;
    shopAddress1: string;
    mobile: string;
    latitude: string;
    longitude: string;
    distance: string;
    distanceNumber: number;
    batteryNum: string;
    freeNum: string;
    canReturnNum: string;
    chargingBatteryNum: string;
    cabinetNum: number;
    businessStatus: number;
    shopBanner: string;
    shopIcon: string;
    shopTime: string;
    shopUrl: string;
    sceneType: string;
    sceneTypeDesc: string;
    pStoreType: string;
    pMian: string;
    pJifei: string;
    pJifeiDanwei: string;
    pFengding: string;
    pYajin: string;
    pPriceid: string;
    currencyName: string;
    infoStatus: string;
}

export interface PriceStrategy {
    p_id: number;
    p_name: string;
    p_type: string;
    p_ptID: string;
    p_price: string;
    p_price_minute: string;
    p_deposit_amount: string;
    p_deposit_minutes: string;
    p_overtime_amount: string;
    p_overtime_day: string;
    p_freeuse_minute: string;
    p_first_amount: string;
    p_first_minutes: string;
    p_day_amount: string;
    p_day_use_free_count: string;
    p_priority: string;
    p_shopID: string;
    p_status: string;
    [key: string]: unknown;
}

export interface PriceStrategyResponse {
    data: PriceStrategy[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface ApiResponse {
    msg: string;
    code: number;
    list: Station[];
}
