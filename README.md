# zexe

## Backend APIS

### 1. For Fetching All Pairs Details

### Route /v/version/pair/allpairs?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/v/1/pair/allpairs?chainId=421613
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "id": "0xda509e348e9ba4dfd5606a2913c80347f7bee1bc2a5ba42ded50a3bc158f5078",
            "price": "1100000000000000000000",
            "priceDecimals": "2",
            "priceDiff": "100000000000000000000",
            "marginEnabeled": false,
            "minToken0Order": "10000000000",
            "tokens": [
                {
                    "id": "0x1fe7250ca569bb07610596d2371f2e83fae3ea2b",
                    "name": "Wrapped Ethereum",
                    "symbol": "WETH",
                    "decimals": 18
                },
                {
                    "id": "0x95e3d2540479c67596575971b69b0c3951837359",
                    "name": "USD Coin",
                    "symbol": "USDC",
                    "decimals": 18
                }
            ]
        }
    ]
}
```

### 2. For Fetching All Orders Of Pair

### Route /v/version/orders/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/v/1/pair/orders/:pairId?chainId=421613

```

### Expected Output

```
{
    "status": true,
     "data": {
        "pair": "0xda509e348e9ba4dfd5606a2913c80347f7bee1bc2a5ba42ded50a3bc158f5078",
        "decimals": 18,
        "sellOrders": [
            {
                "price": "1000000000000000000000",
                "token0Amount": "2000000000000000000"
            }
        ],
        "buyOrders": [
            {
                "price": "1100000000000000000000",
                "token0Amount": "1000000000000000000"
            },
            {
                "price": "1000000000000000000000",
                "token0Amount": "10000000000000000000"
            }
        ]
    }
}
```

### 3. For Fetching Pairs Price Trend

### Route /pair/pricetrend/:pairId?chainId&interval

### Expected Input

```
Method : Get
Url : http://localhost:3010/pair/pricetrend/:pairId?chainId=421613&interval=300000
interval is mandatory which must be greater than 300000 miliseconds
```

### Expected Output

```
{
    "status": true,
    "data": {
        "exchangeRate": [
            {
                "time": 1668001491,
                "open": "17000",
                "high": "17000",
                "close": "17000",
                "low": "17000"
            },
            {
                "time": 1668002049,
                "open": "16600",
                "high": "18000",
                "close": "18000",
                "low": "16601"
            },
            ...
        ],
        "volume": [
            {
                "time": 1668001491,
                "value": "0.588235294117647059"
            },
            {
                "time": 1668002049,
                "value": "0.906764705882352942"
            },
            ...
        ]
    }
}
```

### 4. For Fetching Pairs Orders History

### Route /v/version/pair/orders/history/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/v/1/pair/orders/history/:pairId?chainId=421613
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "fillAmount": "1000000000000000000",
            "price": "1100000000000000000000",
            "action": "2"
        },
        {
            "fillAmount": "1000000000000000000",
            "price": "1000000000000000000000",
            "action": "1"
        },
        {
            "fillAmount": "1000000000000000000",
            "price": "1000000000000000000000",
            "action": "0"
        },
        ...
    ]
}
```

### 5. For Fetching Pairs Trading Status

### Route /v/version/pair/trading/status/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/v/1/pair/trading/status/:pairId?chainId=421613
```

### Expected Output

```
{
    "status": true,
    "data": [
         {
            "interval": "_24hr",
            "changeInER": 0,
            "volume": 0
        },
        {
            "interval": " _7D",
            "changeInER": 10,
            "volume": 20
        },
        {
            "interval": " _30D",
            "changeInER": 10,
            "volume": 20
        },
        {
            "interval": "_90D",
            "changeInER": 10,
            "volume": 20
        },
        {
            "interval": " _1Yr",
            "changeInER": 10,
            "volume": 20
        }
    ]
}
```

### 6. For Fetching Pairs Limit Matched Orders Details

### Route /v/version/order/limit/matched/:pairId?price&amount&orderType&chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/order/limit/matched/:pairId?price=1000000000000000000000&orderType=0&amount=1000000000000000000&chainId=421613
all fields are mandatory
orderType = 0 for buy, 1 for sell
amount = value * 10**decimals , i.e 18
exchangeRate = value * 10**18

```

### Expected Output

```
{
    "status": true,
    "data": [
         {
            "signature": "0xc07b6909701f5e7a20c5e6796c1be8f0e36fb0a9dea9f7db94aff75b6dbe918e486658f72cc340440966fb785492f7a3a88096c2ce59de3c4503aae0b39ce2521b",
            "id": "0xade5f8a4403d419b7595ffe197aa813fdb5c625a04c8604c1b4a15617230b0a7",
            "value": {
                "maker": "0x103b62f68da23f20055c572269be67fa7635f2fc",
                "token0": "0x1fe7250ca569bb07610596d2371f2e83fae3ea2b",
                "token1": "0x95e3d2540479c67596575971b69b0c3951837359",
                "token0Amount": "1000000000000000000",
                "token1Amount": "1000000000000000000000",
                "leverage": "5",
                "price": "1000000000000000000000",
                "expiry": "1677768180",
                "nonce": "6544098",
                "action": 1,
                "position": 0
            }
        },
        {
            "signature": "0xa20d65521de2caa7f1fbc7a5c3f42ae0645922d719624f0f5f682308107de261765b2b45124e0f4614d4dbcc820972f2063e115f5079edaf36a743fc5590173a1c",
            "id": "0xab3a3156c389dfa095b28d874833e38b092f40c6fd32db8eadcd2e808e5d9d43",
            "value": {
                "maker": "0x103b62f68da23f20055c572269be67fa7635f2fc",
                "token0": "0x1fe7250ca569bb07610596d2371f2e83fae3ea2b",
                "token1": "0x95e3d2540479c67596575971b69b0c3951837359",
                "token0Amount": "1000000000000000000",
                "token1Amount": "1000000000000000000000",
                "leverage": "5",
                "price": "1000000000000000000000",
                "expiry": "1677768274",
                "nonce": "8196953",
                "action": 1,
                "position": 0
            }
        }
        ...
    ]
}
```

### 7. For Fetching Pairs Market Matched Order Details

### Route /v/version/order/market/matched/:pairId?orderType&amount&chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/v/1/order/market/matched/:pairId?orderType=0&amount=2000000000&chainId=421613
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "signature": "0x50b53c4c7e888795b8441e45ff4513aca4578da27ea72998dfdc9c26a46d24d769ffa4a1ef74b5a3a4b13f5fe23806cd1f3690f3f967922788939550bcb0ded31b",
            "id": "0x015f29728d63da305fef87ed66090451d1b303aab31cf96d27cf382eed70e5ee",
            "value": {
                "maker": "0x103b62f68da23f20055c572269be67fa7635f2fc",
                "token0": "0x1fe7250ca569bb07610596d2371f2e83fae3ea2b",
                "token1": "0x95e3d2540479c67596575971b69b0c3951837359",
                "token0Amount": "1000000000000000000",
                "token1Amount": "1000000000000000000000",
                "leverage": "1",
                "price": "1100000000000000000000",
                "expiry": "1677823798",
                "nonce": "5734547",
                "action": 2,
                "position": 0
            }
        },
        {
            "signature": "0x4511b1903c2459c4f6f96477a5be66d05e59846eb6250c8bc8de968a9950f0583cb25047e0f8ede5ac1414cc38223fb86169c0c52cf6daad18fabb33f265eebb1c",
            "id": "0x0279ca35dc71c930c3df4938906711312c329aadf582f1741d28be131f6713f4",
            "value": {
                "maker": "0x103b62f68da23f20055c572269be67fa7635f2fc",
                "token0": "0x1fe7250ca569bb07610596d2371f2e83fae3ea2b",
                "token1": "0x95e3d2540479c67596575971b69b0c3951837359",
                "token0Amount": "1000000000000000000",
                "token1Amount": "1000000000000000000000",
                "leverage": "1",
                "price": "1000000000000000000000",
                "expiry": "1677750957",
                "nonce": "7476993",
                "action": 2,
                "position": 0
            }
        },
        ...
    ]
}
```

### 8. For Fetching All Tokens Details

### Route /v/version/tokens?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/v/1/tokens?chainId=CHAIN_ID
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "id": "0x2F123F27fC28Eba0101BDb439F32eBf05732d475",
            "name": "BTC",
            "symbol": "BTC",
            "decimals": 18
        },
        {
            "id": "0x930De8B1997a2F4b3B7cc93d7101E2F14b25792c",
            "name": "USDC",
            "symbol": "USDC",
            "decimals": 18
        }
    ]
}
```

### 9. For Fetching Users Inorder Balance

### Route /v/version/user/inorder/balance/:maker/token/:token?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/v/1/user/inorder/balance/:maker/token/:token?chainId=421613
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "id": "0x186b4b5Da9E6817C21818DEb83BBA02c4c66627F",
            "token": "0x930De8B1997a2F4b3B7cc93d7101E2F14b25792c",
            "inOrderBalance": "250522218240708900000000",
            "chainId": 421613
        }
    ]
}
```

### 10. For Fetching Users Placed Orders Of Pair

### Route /v/version/user/orders/placed/:maker/pair/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/v/1/user/orders/placed/:maker/pair/:pairId?chainId=421613
maker : user wallet address
```

### Expected Output

```
{
    "status": true,
    "data": [
         {
            "signature": "0x50b53c4c7e888795b8441e45ff4513aca4578da27ea72998dfdc9c26a46d24d769ffa4a1ef74b5a3a4b13f5fe23806cd1f3690f3f967922788939550bcb0ded31b",
            "id": "0x015f29728d63da305fef87ed66090451d1b303aab31cf96d27cf382eed70e5ee",
            "value": {
                "maker": "0x103b62f68da23f20055c572269be67fa7635f2fc",
                "token0": "0x1fe7250ca569bb07610596d2371f2e83fae3ea2b",
                "token1": "0x95e3d2540479c67596575971b69b0c3951837359",
                "token0Amount": "1000000000000000000",
                "token1Amount": "1000000000000000000000",
                "leverage": "1",
                "price": "1100000000000000000000",
                "expiry": "1677823798",
                "nonce": "5734547",
                "action": 2,
                "position": 0
            }
        },
        {
            "signature": "0xa20d65521de2caa7f1fbc7a5c3f42ae0645922d719624f0f5f682308107de261765b2b45124e0f4614d4dbcc820972f2063e115f5079edaf36a743fc5590173a1c",
            "id": "0xab3a3156c389dfa095b28d874833e38b092f40c6fd32db8eadcd2e808e5d9d43",
            "value": {
                "maker": "0x103b62f68da23f20055c572269be67fa7635f2fc",
                "token0": "0x1fe7250ca569bb07610596d2371f2e83fae3ea2b",
                "token1": "0x95e3d2540479c67596575971b69b0c3951837359",
                "token0Amount": "1000000000000000000",
                "token1Amount": "1000000000000000000000",
                "leverage": "5",
                "price": "1000000000000000000000",
                "expiry": "1677768274",
                "nonce": "8196953",
                "action": 1,
                "position": 0
            }
        },
        ...
    ]
}
```

### 11. For Fetching Users Orders History Of Pair

### Route /v/version/user/orders/history/:taker/pair/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/v/1/user/orders/history/:taker/pair/:pairId?chainId=421613
taker : user wallet address
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "fillAmount": "87199584212942720",
            "price": "20827000000000000000000",
            "action": 0
        },
        {
            "fillAmount": "436837079722483650",
            "price": "21634000000000000000000",
            "action": 0
        },
        ...
    ]
}
```

### 12. For Fetching Users Cancelled Orders Of Pair

### Route /v/version/user/orders/cancelled/:maker/pair/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/v/version/user/orders/cancelled/:maker/pair/:pairId?chainId=421613
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "price": "23678000000000000000000",
            "action": 0,
            "amount": "463451784551381840"
        },
        {
            "price": "15363000000000000000000",
            "action": 0,
            "amount": "1000000000000000000"
        },
        ...
    ]
}
```

### 13. For Order Creation

### Route /order/create

### Expected Input

```
Method : Get
Url : http://localhost:3010/order/create
```

### Expected Input in body

```
{
    "data" :{
        "maker": "0x103B62f68Da23f20055c572269be67fA7635f2fc",
        "token0": "0x842681C1fA28EF2AA2A4BDE174612e901D2b7827",
        "token1": "0xa50fABf59f2c11fF0F02E7c94A82B442611F37B2",
        "token0Amount": "1000000000000000000",
        "token1Amount": "1000000000000000000",
        "leverage": 1,
        "price": "18000000000000000000000",
        "expiry": "1677762966",
        "nonce": "12345",
        "action": 1,
        "position": 0
    },
    "signature":"0x6de29ba3e7429142040bb55ceb3fb2fc0de6d8c0c02f8ba1a51885b8726d6e1f595833bf10d8bab3a8e65379d8e8159fb20d42ca8c0ff76fa2db3df1017679c21c",
    "chainId": "421613"
}
```

### Expected Output

```
{status: true, message: "Order created successfully"}
```
