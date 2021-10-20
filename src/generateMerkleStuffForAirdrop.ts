import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'
import { solidityKeccak256 } from 'ethers/lib/utils'
import allowlist from '../allowlist.json'
import * as fs from 'graceful-fs'

function hashToken(tokenId: string, account: string) {
  return Buffer.from(
    solidityKeccak256(['uint256', 'address'], [tokenId, account]).slice(2),
    'hex'
  )
}

async function main() {
  // Construct tokenId to signer address
  const signers = allowlist
  const tokenIdAndSignerAddress: [string, string][] = signers.map(
    (signer, i) => [String(i + 1), signer.address]
  )

  let addressToTokenIdMap: object = {}
  tokenIdAndSignerAddress.forEach(([tokenId, address]) => {
    addressToTokenIdMap[address] = tokenId
  })

  let tokenIdToAddressMap: object = {}
  tokenIdAndSignerAddress.forEach(([tokenId, address]) => {
    tokenIdToAddressMap[tokenId] = address
  })

  const merkletree = new MerkleTree(
    Object.entries(tokenIdToAddressMap).map((token) => hashToken(...token)),
    keccak256,
    { sortPairs: true }
  )

  let addressToProofMap: object = {}
  tokenIdAndSignerAddress.forEach(([tokenId, address]) => {
    addressToProofMap[address] = {
      tokenId,
      proof: merkletree.getHexProof(
        hashToken(addressToTokenIdMap[address], address)
      ),
    }
  })

  console.log('Root: ' + merkletree.getHexRoot())

  fs.writeFileSync(
    'merkle-drop-data.json',
    JSON.stringify({
      root: merkletree.getHexRoot(),
      addressToProofMap,
    })
  )
}

try {
  main()
} catch (e) {
  console.error(e)
}
