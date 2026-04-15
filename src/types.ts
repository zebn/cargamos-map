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
    currencyName: string;
    infoStatus: string;
}

export interface ApiResponse {
    msg: string;
    code: number;
    list: Station[];
}
