import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './utils/deploy';
import { weiToEther, parseEther, getWalletBalance,loadEscrows } from './utils/utils';
import Escrow from './Escrow';

const provider = new ethers.providers.JsonRpcProvider(
  'http://localhost:8545'
)

export async function approve(escrowContract, signer) {
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [address, setAddress] = useState("");
  const [signer, setSigner] = useState();
  const [accounts, setAccounts] = useState([]);
  const [balance, setBalance] = useState("");

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.listAccounts();
      setAccounts(accounts);
      await switchAccount(accounts[0]);
      let address = provider.getSigner(accounts[0]);
      console.log(address)
      await retrieveContracts(address);
    }
    getAccounts();
    
  }, []);

  useEffect(() => {
    if (address.length) {
      getBalance();
    }
  },[address]);
  
  async function switchAccount(accI){
    setSigner(provider.getSigner(accounts[accI]));
    let _a = await provider.getSigner(accounts[accI]).getAddress();
    setAddress(_a);
  }

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = parseEther(document.getElementById('eth').value);
    const escrowContract = await deploy(signer, arbiter, beneficiary, value);
    console.log(escrowContract)
    let e = await parseEscrow(escrowContract,arbiter,beneficiary,value);
    console.log(e)
    setEscrows([...escrows,e]);
  }

  async function retrieveContracts(signer){
    let escrows = await loadEscrows(provider, signer);
    console.log(escrows)
    let formatted = []
    for (let i = 0; i < escrows.length; i++) {
      let e = escrows[i];
      
      console.log(e)
      let arbiter = ""
      let beneficiary = ""
      try {
        arbiter = await e.arbiter();
        beneficiary = await e.beneficiary();
      } catch (e) {
        console.log(e)
      }
      // Get balance of contract
      let value = await provider.getBalance(e.address);
      e = await parseEscrow(e,arbiter,beneficiary,value,signer);
      formatted.push(e);
    }
    console.log(formatted)
    setEscrows(formatted);
  }

  async function parseEscrow(escrowContract,arbiter,beneficiary,value,signer){
    const escrow = {
      address: escrowContract.address,
      arbiter: arbiter,
      beneficiary: beneficiary,
      value: value,
      handleApprove: async () => {
        escrowContract.on('Approved', () => {
          document.getElementById(escrowContract.address).className =
            'complete';
          document.getElementById(escrowContract.address).innerText =
            "✓ It's been approved!";
        });

        await approve(escrowContract, signer);
      },
    };
    return escrow;
  }

  async function getBalance() {
    const balance = await getWalletBalance(signer);
    setBalance(weiToEther(balance));
  }

  return (
    <>
      {
        accounts.length?
        <select id="account" onChange={(e) => {switchAccount(e.target.value)} }>
          {accounts.map((account,i) => {
            return <option key={account} value={i}>{account}</option>;
          })}
        </select>
        :null
      }
      { 
        address.length? 
        <div>
          <p>Current Connected Wallet: {address}</p>
          <p>Balance: {Number(balance).toFixed(2)} ETH</p>
        </div> 
        :null
      }
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          {/* <input type="text" id="arbiter" /> */}
          <select id="arbiter">
            {accounts.map((account) => {
              return <option key={account} value={account}>{account}</option>;
            })}
          </select>
        </label>

        <label>
          Beneficiary Address
          {/* <input type="text" id="beneficiary" /> */}
          <select id="beneficiary">
            {accounts.map((account) => {
              return <option key={account} value={account}>{account}</option>;
            })}
          </select>
        </label>

        <label>
          Deposit Amount (in eth)
          <input type="text" id="eth" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((e) => {
            return <Escrow 
              key={e.address}  
              address={e.address}
              arbiter={e.arbiter}
              beneficiary={e.beneficiary}
              value={e.value}
              handleApprove={e.handleApprove}
              />;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
