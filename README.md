# zexe

## Backend APIS

### 1. For Fetching All Pairs Details

### Route /pair/allpairs?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/pair/allpairs?chainId
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "id": "0x3b8025593f618d3dc1452325f3804f0229252f135e4eb37cc29832428b8e2475",
            "exchangeRate": "20297000000000000000000",
            "exchangeRateDecimals": "2",
            "priceDiff": "-2675000000000000000000",
            "minToken0Order": 10000000000,
            "tokens": [
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
    ]
}
```

### 2. For Fetching All Orders Of Pair

### Route /orders/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/pair/orders/:pairId?chainId

```

### Expected Output

```
{
    "status": true,
    "data": {
        "pair": "0x3b8025593f618d3dc1452325f3804f0229252f135e4eb37cc29832428b8e2475",
        "decimals": 18,
        "sellOrders": [
            {
                "exchangeRate": "15097000000000000000000",
                "amount": "3840038726682134800"
            },
            {
                "exchangeRate": "15229000000000000000000",
                "amount": "590873225312305000"
            },
            ...
        ],
        "buyOrders": [
            {
                "exchangeRate": "24712000000000000000000",
                "amount": "4204244406902972000"
            },
            {
                "exchangeRate": "23678000000000000000000",
                "amount": "4223329673114283"
            },
            ...
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
                "low": "16600"
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
                "value": "0.906764705882352941"
            },
            ...
        ]
    }
}
```

### 4. For Fetching Pairs Orders History

### Route /pair/orders/history/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/pair/orders/history/:pairId?chainId=421613
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "fillAmount": "326049896735370200",
            "exchangeRate": "20297000000000000000000",
            "orderType": 1
        },
        {
            "fillAmount": "338506571519004000",
            "exchangeRate": "22972000000000000000000",
            "orderType": 0
        },
        {
            "fillAmount": "87199584212942720",
            "exchangeRate": "20827000000000000000000",
            "buyorderType": 0
        },
        ...
    ]
}
```

### 5. For Fetching Pairs Trading Status

### Route /pair/trading/status/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/pair/trading/status/:pairId?chainId=421613
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "interval": "_24hr",
            "changeInER": -32.068965517241374,
            "volume": 49.858473253676465
        },
        {
            "interval": " _7D",
            "changeInER": 15.88235294117647,
            "volume": 52.35347325367647
        },
        {
            "interval": " _30D",
            "changeInER": 15.88235294117647,
            "volume": 52.35347325367647
        },
        {
            "interval": "_90D",
            "changeInER": 15.88235294117647,
            "volume": 52.35347325367647
        },
        {
            "interval": " _1Yr",
            "changeInER": 15.88235294117647,
            "volume": 52.35347325367647
        }
    ]
}
```

### 6. For Fetching Pairs Limit Matched Orders Details

### Route /order/limit/matched/:pairId?exchangeRate&amount&buy&chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/order/limit/matched/:pairId?exchangeRate=19097000000000000000000&orderType=0&amount=1000000000000000000&chainId=421613
all fields are mandatory
orderType = 0 for buy, 1 for sell, 2 for long, 3 for short
amount = value * 10**decimals , i.e 18
exchangeRate = value * 10**18

```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "signature": "0xcbd3cbcf0db6484191162024a290073b109eb40726f3d6f8874aad4ff5f0408c0ba9d43c4f8de2aa23aa4c1068d80997ffef6496c615875f57b9f2a3b64739141b",
            "value": {
                "maker": "0x186b4b5Da9E6817C21818DEb83BBA02c4c66627F",
                "token0": "0x2F123F27fC28Eba0101BDb439F32eBf05732d475",
                "token1": "0x930De8B1997a2F4b3B7cc93d7101E2F14b25792c",
                "amount": "3840038726682134800",
                "orderType": 1,
                "salt": "7442174",
                "exchangeRate": "15097000000000000000000"
            }
        },
        {
            "signature": "0xb668b9fb1efb7b70460d209a3119894444edce60211eab15a21f48acb4372d391041fb7708e0128aac9e7b147ddb8c92c6657c44cc9cc5b2d394101ba7729f021c",
            "value": {
                "maker": "0x186b4b5Da9E6817C21818DEb83BBA02c4c66627F",
                "token0": "0x2F123F27fC28Eba0101BDb439F32eBf05732d475",
                "token1": "0x930De8B1997a2F4b3B7cc93d7101E2F14b25792c",
                "amount": "590873225312305000",
                "orderType": 1,
                "salt": "3346665",
                "exchangeRate": "15229000000000000000000"
            }
        },
        ...
    ]
}
```

### 7. For Fetching Pairs Market Matched Order Details

### Route /order/market/matched/:pairId?buy&amount&chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/order/market/matched/:pairId?orderType=0&amount=2000000000&chainId=421613
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "signature": "0xcbd3cbcf0db6484191162024a290073b109eb40726f3d6f8874aad4ff5f0408c0ba9d43c4f8de2aa23aa4c1068d80997ffef6496c615875f57b9f2a3b64739141b",
            "value": {
                "maker": "0x186b4b5Da9E6817C21818DEb83BBA02c4c66627F",
                "token0": "0x2F123F27fC28Eba0101BDb439F32eBf05732d475",
                "token1": "0x930De8B1997a2F4b3B7cc93d7101E2F14b25792c",
                "amount": "3840038726682134800",
                "orderType": 1,
                "salt": "7442174",
                "exchangeRate": "15097000000000000000000"
            }
        },
        {
            "signature": "0xb668b9fb1efb7b70460d209a3119894444edce60211eab15a21f48acb4372d391041fb7708e0128aac9e7b147ddb8c92c6657c44cc9cc5b2d394101ba7729f021c",
            "value": {
                "maker": "0x186b4b5Da9E6817C21818DEb83BBA02c4c66627F",
                "token0": "0x2F123F27fC28Eba0101BDb439F32eBf05732d475",
                "token1": "0x930De8B1997a2F4b3B7cc93d7101E2F14b25792c",
                "amount": "590873225312305000",
                "orderType": 1,
                "salt": "3346665",
                "exchangeRate": "15229000000000000000000"
            }
        },
        ...
    ]
}
```

### 8. For Fetching All Tokens Details

### Route /tokens?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/tokens?chainId=CHAIN_ID
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

### Route /user/inorder/balance/:maker/token/:token?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/user/inorder/balance/:maker/token/:token?chainId=421613
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

### Route /user/orders/placed/:maker/pair/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/user/orders/placed/:maker/pair/:pairId?chainId=421613
maker : user wallet address
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "id": "0xae7ff72e1c2fb29dcbe0d922be5f1a481a4b97dcf94a6807ae369adc9012b310",
            "amount": "720429376694885500",
            "exchangeRate": "21634000000000000000000",
            "orderType": 0
        },
        {
            "id": "0x55d8b8381426759a852f0c6f96c22c86e39303f6945ec9e3827e3f9a023e7763",
            "amount": "174327979987294320",
            "exchangeRate": "23635000000000000000000",
            "orderType": 0
        },
        {
            "id": "0x90ab70e12e23e313f2f65b95da2fc806b43671bff1762640c8b5fa369e6eb416",
            "amount": "558142806018918000",
            "exchangeRate": "17676000000000000000000",
            "orderType": 0
        }
        ...
    ]
}
```

### 11. For Fetching Users Orders History Of Pair

### Route /user/orders/history/:taker/pair/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/user/orders/history/:taker/pair/:pairId?chainId=421613
taker : user wallet address
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "fillAmount": "87199584212942720",
            "exchangeRate": "20827000000000000000000",
            "orderType": 0
        },
        {
            "fillAmount": "436837079722483650",
            "exchangeRate": "21634000000000000000000",
            "orderType": 0
        },
        ...
    ]
}
```

### 12. For Fetching Users Cancelled Orders Of Pair

### Route /user/orders/cancelled/:maker/pair/:pairId?chainId

### Expected Input

```
Method : Get
Url : http://localhost:3010/user/orders/cancelled/:maker/pair/:pairId?chainId=421613
```

### Expected Output

```
{
    "status": true,
    "data": [
        {
            "exchangeRate": "23678000000000000000000",
            "orderType": 0,
            "balanceAmount": "463451784551381840"
        },
        {
            "exchangeRate": "15363000000000000000000",
            "orderType": 0,
            "balanceAmount": "0"
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
        "amount": "1000000000000000000",
        "orderType": 1,
        "salt": "12345",
        "exchangeRate": "18000000000000000000000",
        "borrowLimit": 0,
        "loops": 0
    },
    "signature":"0x6de29ba3e7429142040bb55ceb3fb2fc0de6d8c0c02f8ba1a51885b8726d6e1f595833bf10d8bab3a8e65379d8e8159fb20d42ca8c0ff76fa2db3df1017679c21c",
    "chainId": "421613"
}
```

### Expected Output

```
{status: true, message: "Order created successfully"}
```
