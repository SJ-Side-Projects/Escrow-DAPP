import { ethers } from 'ethers';
import Escrow from '../artifacts/contracts/Escrow.sol/Escrow';

function parseEther(eth) {
  return ethers.utils.parseEther(eth);
}

function weiToEther(wei) {
  return ethers.utils.formatEther(wei);
}

async function getWalletBalance(wallet) {
  return await wallet.getBalance();
}

// Load deployed contracts
async function loadEscrows(provider, signer) {
  console.log(signer)
  const factory = new ethers.ContractFactory(
    Escrow.abi,
    Escrow.bytecode,
    signer
  );
  let addresses = await parseLogs(provider)
  let escrows = []
  for (let i = 0; i < addresses.length; i++) {
    let escrow = factory.attach(addresses[i]);
    escrows.push(escrow);
  }

  return escrows;
}

async function parseLogs(provider){
  // Get latest block number
  const blockNumber = await provider.getBlockNumber();
  let addressLs = new Set();
  // Iterate over each block and parse logs
  for (let i = blockNumber; i > 0; i--) {
    const block = await provider.getBlock(i);
    for (let j = 0; j < block.transactions.length; j++) {
      const tx = await provider.getTransaction(block.transactions[j]);
      // console.log(tx.creates);
      if (tx.creates){
        addressLs.add(tx.creates)
      }
      // const receipt = await provider.getTransactionReceipt(block.transactions[j]);
      // if (receipt.logs.length > 0) {
      //   for (let k = 0; k < receipt.logs.length; k++) {
      //     sieveLog(receipt.logs[k],escrowFactory)
      //   }
      // }
    }
  }
  return Array.from(addressLs);
}


// async function sieveLog(log){
//   // Convert escrow event to hex
//   const eventHex = ethers.utils.id('Approved(uint256)')
//   const hasByteCode = log.data!=='0x';
//   if (hasByteCode){
//     console.log(log)
//   }
// }


export {
  parseEther,
  weiToEther,
  getWalletBalance,
  loadEscrows
}