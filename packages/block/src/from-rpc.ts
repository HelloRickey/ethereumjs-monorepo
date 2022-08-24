import { TransactionFactory } from '@ethereumjs/tx'
import { TypeOutput, isTruthy, setLengthLeft, toBuffer, toType } from '@ethereumjs/util'

import { blockHeaderFromRpc } from './header-from-rpc'

import { Block } from './index'

import type { BlockOptions } from './index'
import type { TxData, TypedTransaction } from '@ethereumjs/tx'

function normalizeTxParams(_txParams: any) {
  const txParams = Object.assign({}, _txParams)

  txParams.gasLimit = toType(
    txParams.gasLimit === undefined ? txParams.gas : txParams.gasLimit,
    TypeOutput.BigInt
  )
  txParams.data = txParams.data === undefined ? txParams.input : txParams.data

  // check and convert gasPrice and value params
  txParams.gasPrice = toType(txParams.gasPrice, TypeOutput.BigInt)
  txParams.value = toType(txParams.value, TypeOutput.BigInt)

  // strict byte length checking
  txParams.to = isTruthy(txParams.to) ? setLengthLeft(toBuffer(txParams.to), 20) : null

  // v as raw signature value {0,1}
  // v is the recovery bit and can be either {0,1} or {27,28}.
  // https://ethereum.stackexchange.com/questions/40679/why-the-value-of-v-is-always-either-27-11011-or-28-11100
  txParams.v = toType(txParams.v, TypeOutput.BigInt)!

  return txParams
}

/**
 * Creates a new block object from Ethereum JSON RPC.
 *
 * @param blockParams - Ethereum JSON RPC of block (eth_getBlockByNumber)
 * @param uncles - Optional list of Ethereum JSON RPC of uncles (eth_getUncleByBlockHashAndIndex)
 * @param options - An object describing the blockchain
 */
export function blockFromRpc(blockParams: any, uncles: any[] = [], options?: BlockOptions) {
  const header = blockHeaderFromRpc(blockParams, options)

  const transactions: TypedTransaction[] = []
  if (isTruthy(blockParams.transactions)) {
    const opts = { common: header._common }
    for (const _txParams of blockParams.transactions) {
      const txParams = normalizeTxParams(_txParams)
      const tx = TransactionFactory.fromTxData(txParams as TxData, opts)
      transactions.push(tx)
    }
  }

  const uncleHeaders = uncles.map((uh) => blockHeaderFromRpc(uh, options))

  return Block.fromBlockData({ header, transactions, uncleHeaders }, options)
}
