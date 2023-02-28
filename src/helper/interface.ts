


export interface ifOrderCreated {
    id: string
    signature: string
    pair: string
    pairPrice: string
    maker: string
    token0: string
    token1: string
    token0Amount: string
    token1Amount: string
    price: string
    priceDecimals: string
    balanceAmount: string
    deleted: boolean
    active: boolean
    chainId: string
    cid: string
    cancelled: boolean
    _id: string
    action: number
    position: number
    leverage: number
    expiry: string
    nonce:string
    spot:string,
    name:string,
    version:string
   
}

export interface ifUserPosition {
    id: string,
    token: string,
    balance: number,
    inOrderBalance: number,
    chainId: string
    _id: string
}

export interface ifPair {
    id: string
    token0: string
    token1: string
    priceDecimals: string
    minToken0Order: string
    price: string
    priceDiff: string
    chainId: string
    _id: string
    marginEnabled: boolean,
    active: boolean
    action:number
    position:number
    leverage:number

}

export interface orderSignature {
    id: string
    signature: string
    value: {
        maker: string
        token0: string
        token1: string
        amount: string
        orderType: number
        salt: string
        exchangeRate: string
        borrowLimit: string
        loops: string
    }

}


export interface ifSync {
    blockNumberExchange: number,
    pageNumberExchange: number,
    chainId: string
}

export interface ifHandleOrderExecuted {
    (data: any, argument: any): void
}

export interface ifHandleOrderCancelled {
    (data: any): void
}


export interface ifEventListner {
    contractAddress: string
    abi: object[]
    handlers: any
    chainId: string
}

export type Interval = "5" | "15" | "30" | "60" | "240" | "1D" | "1W";