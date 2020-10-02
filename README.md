# Collection_USDT
归集ERC20 USDT脚本
### 使用说明
Make sure you have node.js version 11 or above
1. `git clone git@github.com:fuckgm/Collection_USDT.git`
2. `npm install`
3. 修改 `.env` 文件
```
GAS_PRICE=5 # check gas prices FAST value https://ethgasstation.info/
RPC_URL=https://mainnet.infura.io/v3/YOUR_TOKEN
TOKEN_ADDRESS=0xfab46e002bbf0b4509813474841e0716e6730136 # for ether use `ETH`,其他使用token的address
TARGET_ADDRESS=0x9fCD29A0985fFb07E6D89c0Dd5325917F6FD9A85 #归集接受地址
FEE_PARIVATE=  #手续费地址私钥
```
| NAME | VALUE |
| --- | --- |
| GAS_PRICE | Gas price in GWEI |
| RPC_URL | Ethereum node RPC URL |
| TOKEN_ADDRESS | Token address OR `ETH` |
| TARGET_ADDRESS | Address where to receive tokens |

4. 提供如下格式的 `list.csv`(地址,私钥) :
```
0x778ac398BA3Cf7071d1A5564729750c56f179527,2fa2305987dcb17d9e35aad0a61e1f676b0d7f6348e938df05baedef028b7550
0x1Ae0Fbaba90E4fd2D5B00f1d1dD0F62D4d922f58,149e0fc9800aa363bb5accb6b4e2ce563c6a6f6dbdd15a3c53b354ae2b2824a9
```
地址带 0x
私钥不带 0x

5. 运行 `npm run start`

PS:
可用generateAddresses.js生成如上格式的list.csv文件
