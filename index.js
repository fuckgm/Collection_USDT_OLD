require("dotenv").config()
const Web3 = require("web3")
const { toBN, toWei, fromWei, toChecksumAddress } = require("web3-utils");
const fs = require("fs")
const ERC20_ABI = require("./ERC20.abi.json")
const { GAS_PRICE, RPC_URL, TARGET_ADDRESS, TOKEN_ADDRESS ,FEE_PARIVATE} = process.env
console.log(`Running with following parameteres:\n ${JSON.stringify({ GAS_PRICE, RPC_URL, TARGET_ADDRESS, TOKEN_ADDRESS }, null, ' ')}`)
const web3 = new Web3(RPC_URL, null, { transactionConfirmationBlocks: 1 }) // todo: more confirmation block
const ethfee=fromWei(toBN(toWei(GAS_PRICE, 'gwei')).mul(toBN('21000')))

let success = 0
let error = 0
let zero = 0
let insufficientFunds = 0
let sum = toBN("0")
let sumtoken = toBN("0")

async function readKeys() {
  let lines
  try {
    lines = fs.readFileSync("./list.csv").toString().split(/\r?\n/)
  } catch (e) {
    console.error('Please provide list.csv file')
    process.exit(1)
  }
  return lines.map(a => a.trim()).filter(a => a.length > 0 && a.includes(',')).map(a => a.split(',')[1].trim())
}

async function sendErc20(privateKey, index) {
  const erc20Token = new web3.eth.Contract(ERC20_ABI, toChecksumAddress(TOKEN_ADDRESS))
  let account
  try {
    account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey)
    web3.eth.accounts.wallet.add('0x' + privateKey)
  } catch {
    error++
    console.log(`Account ${privateKey} has invalid format`)
  }
  try {
    // console.log(`Balance of ${account.address} = ${fromWei(balance)} ETH`)
    const balance = await erc20Token.methods.balanceOf(account.address).call()
    const ethbalance = await web3.eth.getBalance(account.address)
    const eth=fromWei(ethbalance)
    const symbol = await erc20Token.methods.symbol().call()
    // const decimals = await erc20Token.methods.decimals().call()
    // const gasprice = await web3.eth.getGasPrice()//获取gasprice
    // console.log(`gasprice:${fromWei(gasprice,'gwei')}`)
    // return
    // console.log(`ethbalance:${ethbalance}`)
    // console.log(`eth:${eth}`)
    // console.log(`Balance of ${account.address} = ${fromWei(balance)} SXP`)
    if (balance > 0) {
       let gas = await erc20Token.methods.transfer(TARGET_ADDRESS, balance).estimateGas({ from: account.address })
       // console.log(eth)
       // console.log(ethfee)
       // return
      if(eth>=ethfee){//eth余额>=需要的手续费
        let receipt = await erc20Token.methods.transfer(TARGET_ADDRESS, balance).send({
          from: account.address,
          gas,
          gasPrice: toWei(GAS_PRICE, 'gwei')
        }).once("transactionHash", function (txHash) {
          console.log(`${index + 1}: Withdrawn ${fromWei(balance,'mwei')} ${symbol} from ${account.address}, tx hash:\nhttps://etherscan.io/tx/${txHash}`)
        })
        success++
        sumtoken = sumtoken.add(toBN(balance))
      }else{
        // let gasuse=fromWei(toBN(gas*toBN(toWei(GAS_PRICE, 'gwei'))));//gas使用=gas*gasprice
        // console.log(`gasuse:${gasuse}`)
        // let sendfee=parseFloat(gasuse).toFixed(4);
        let sendfee = parseFloat(ethfee-eth);
        // console.log(`gasuse:${sendfee}`)
        // console.log(`gas: ${gas}`);
        sendEthfee(account.address, sendfee)
        zero++
        console.log(`${index + 1}: 账户: ${account.address} 手续费不足,打入手续费${sendfee}.`)
      }
    } else {
      zero++
      // console.log(`${index + 1}: Account: ${account.address} has zero balance, skipping`)
    }
  } catch (e) {
    if (e.message === 'Failed to check for transaction receipt') {
      success++
      sumtoken = sumtoken.add(toBN(toSend))
      return
    }
    error++
    console.log(`${index + 1}: 归集出错,账户: ${account.address}: ${e.message}`)
  }
}

async function sendEth(privateKey, index) {
  let account
  try {
    account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey)
    web3.eth.accounts.wallet.add('0x' + privateKey)
  } catch {
    error++
    console.log(`Account ${privateKey} has invalid format`)
  }
  try {
    const balance = await web3.eth.getBalance(account.address)
    // console.log(`Balance of ${account.address} = ${fromWei(balance)} ETH`)
    const cost = toBN(toWei(GAS_PRICE, 'gwei')).mul(toBN('21000'))
    const toSend = toBN(balance).sub(cost)
    if (toSend.gt(toBN(0))) {
      await web3.eth.sendTransaction({
        from: account.address,
        to: TARGET_ADDRESS,
        gas: 21000,
        value: toSend.toString(),
        gasPrice: toWei(GAS_PRICE, 'gwei')
      }).once("transactionHash", function (txHash) {
        console.log(`${index + 1}: Withdrawn ${fromWei(toSend)} ETH from ${account.address}, tx hash:\nhttps://etherscan.io/tx/${txHash}`)
      })
      success++
      sum = sum.add(toBN(toSend))
    } else {
      insufficientFunds++
      console.log(`${index + 1}: Account ${account.address} has ${fromWei(balance)} balance, skipping`)
      console.log(`cost of tx: ${fromWei(cost)} ETH`)
    }
  } catch (e) {
    if (e.message === 'Failed to check for transaction receipt') {
      success++
      sum = sum.add(toBN(toSend))
      return
    }
    error++
    console.log(`${index + 1}: Error withdrawing from account ${account.address}: ${e.message}`)
  }
}


async function sendEthfee(toaccount, amount) {
    account = web3.eth.accounts.privateKeyToAccount('0x' + FEE_PARIVATE)
    web3.eth.accounts.wallet.add('0x' + FEE_PARIVATE)

  try {
    const balance = await web3.eth.getBalance(account.address)
    // const balance = toWei(amount)
    console.log(`手续费地址 ${account.address} 余额= ${fromWei(balance)} ETH`)
    if(fromWei(balance)<0.005){
      console.log(`手续费地址ETH余额不足0.005,请充值!`)
      return
    }
    const toSend = toBN(toWei(amount))
    if (toSend.gt(toBN(0))) {
      await web3.eth.sendTransaction({
        from: account.address,
        to: toaccount,
        gas: 21000,
        value: toSend.toString(),
        gasPrice: toWei(GAS_PRICE, 'gwei')
      }).once("transactionHash", function (txHash) {
        console.log(`Trance Fee ${fromWei(toSend)} ETH to ${toaccount}, tx hash:\nhttps://etherscan.io/tx/${txHash}`)
      })
    }
  } catch (e) {
    if (e.message === 'Failed to check for transaction receipt') {
      return
    }
    console.log(`发送手续费到地址 ${toaccount}错误: ${e.message}`)
  }
}
async function sendAll(keys) {
  let promises = []
  for (let i = 0; i < keys.length; i++) {
    await delay(100)
    if (TOKEN_ADDRESS === 'ETH') {
      promises.push(sendEth(keys[i], i))
    } else {
      promises.push(sendErc20(keys[i], i))
    }
  }
  await Promise.all(promises)
  console.log(`\n\n完成`)
  console.log(`成功: ${success}`)
  console.log(`失败: ${error}`)
  // console.log(`Zero balance: ${zero}`)
  console.log(`未归集ETH: ${insufficientFunds}`)
  console.log(`累计归集ETH: ${fromWei(sum.toString())}`)
  console.log(`累计归集USDT: ${fromWei(sumtoken.toString(),'mwei')}`)
}

async function main() {
  const keys = await readKeys()
  console.log(`累计${keys.length}账户`)
  await sendAll(keys)
}

const delay = (time) => new Promise(resolve => setTimeout(resolve, time))

main()
