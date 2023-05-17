const { network, getNamedAccounts, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT unit test", function () {
          let deployer, basicNFT
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              basicNFT = await ethers.getContract("BasicNFT", deployer)
          })

          describe("Constructor", function () {
              it("test constructor", async () => {
                  const tokenCounter = await basicNFT.getTokenCounter()
                  const tokenURI = await basicNFT.tokenURI(0)
                  const name = await basicNFT.name()
                  const symbol = await basicNFT.symbol()
                  assert.equal(tokenCounter.toString(), "0")
                  assert.equal(name, "Dogie")
                  assert.equal(symbol, "DOG")
                  assert.equal(
                      tokenURI,
                      "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json"
                  )
              })
          })

          describe("Mint NFT", () => {
              beforeEach(async () => {
                  const txResponse = await basicNFT.mintNft()
                  await txResponse.wait(1)
              })
              it("Allows users to mint an NFT, and updates appropriately", async function () {
                  const tokenURI = await basicNFT.tokenURI(0)
                  const tokenCounter = await basicNFT.getTokenCounter()

                  assert.equal(tokenCounter.toString(), "1")
                  assert.equal(tokenURI, await basicNFT.TOKEN_URI())
              })
              it("Show the correct balance and owner of an NFT", async function () {
                  const deployerBalance = await basicNFT.balanceOf(deployer)
                  const owner = await basicNFT.ownerOf("0")

                  assert.equal(deployerBalance.toString(), "1")
                  assert.equal(owner, deployer)
              })
          })
      })
