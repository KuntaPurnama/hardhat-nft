const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Random Ipfs Unit Test", function () {
          let deployer, vrfCoordinatorV2Mock, randomIpfsNft
          //   const FUND_AMOUNT = ethers.utils.parseEther("0.1")
          const MINT_FEE = ethers.utils.parseEther("0.01")
          const tokenUris = [
              "ipfs://QmQt6RchBQKnSBZjzhZ66nF7YSnDSMrQo6RgPLmk3HMXHq",
              "ipfs://QmauHJ8nGCJJqdy1dGfFiwcp36PzvTkFS3QCj4BT8iWsL4",
              "ipfs://QmW9ToN3WZkrERrVe8Xdigr15FAPDBkpCEj4KC5p5yHJNR",
          ]

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
          })

          describe("test balance", function () {
              it("test balance contract", async () => {
                  await randomIpfsNft.requestNft({ value: MINT_FEE })
                  await randomIpfsNft.getTestBalanceContract()
                  const testbalance = await randomIpfsNft.getTestBalance()
                  const testBalance2 = await randomIpfsNft.getTestBalance2()
                  console.log("test balance", testbalance.toString())
                  console.log("test balance2", testBalance2.toString())
              })
          })

          describe("constructor", function () {
              it("constructor value test", async () => {
                  const tokenCounter = await randomIpfsNft.getTokenCounter()
                  const chanceArray = await randomIpfsNft.getChanceArray()
                  const dogTokenUris = await randomIpfsNft.getDogTokenUris(0)
                  const mintFee = await randomIpfsNft.getMintFee()
                  const initialized = await randomIpfsNft.getInitialized()

                  assert.equal(tokenCounter.toString(), "0")
                  assert.equal(chanceArray.toString(), [10, 30, 60].toString())
                  assert.equal(tokenUris[0].toString(), dogTokenUris.toString())
                  assert.equal(mintFee.toString(), MINT_FEE.toString())
                  assert.equal(initialized.toString(), "true")
              })
          })

          describe("Request NFT", function () {
              it("fails if payment isn't sent with the request", async function () {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })
              it("request nft error balance is not enough", async () => {
                  const mintFee = ethers.utils.parseEther("0.0001")
                  await expect(randomIpfsNft.requestNft({ value: mintFee })).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })
              it("success request NFT kicks off a random word request", async () => {
                  await expect(randomIpfsNft.requestNft({ value: MINT_FEE })).to.be.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", function () {
              it("mints NFT after random number is returned", async () => {
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          try {
                              const tokenUri = await randomIpfsNft.tokenURI("0")
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              assert.equal(tokenCounter.toString(), "1")
                              assert.equal(tokenUri.toString().includes("ipfs://"), true)
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })

                      try {
                          const mintNft = await randomIpfsNft.requestNft({ value: MINT_FEE })
                          const txReceipt = await mintNft.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              txReceipt.events[1].args.requestId,
                              randomIpfsNft.address
                          )
                      } catch (e) {
                          console.log(e)
                      }
                  })
              })
          })

          describe("getBreedFromModdedRng", function () {
              it("get breed out ouf bounds", async () => {
                  await expect(randomIpfsNft.getBreedFromModdedRng(200)).to.be.revertedWith(
                      "RandomIpfsNft__RangeOutOfBounds"
                  )
              })

              it("get breed success", async () => {
                  const breed = await randomIpfsNft.getBreedFromModdedRng(5)
                  assert.equal(breed.toString(), "0")
              })
          })

          describe("withdraw", function () {
              it("withdraw failed not the owner", async () => {
                  const accounts = await ethers.getSigners()
                  const withdrawAccount = accounts[2]

                  const randomIpfsNftWithdrawFailed = await ethers.getContract(
                      "RandomIpfsNft",
                      withdrawAccount.address
                  )

                  await expect(randomIpfsNftWithdrawFailed.withdraw()).to.be.revertedWith(
                      "Ownable: caller is not the owner"
                  )
              })

              it("withdraw success", async () => {
                  const startDeployerBalance = await randomIpfsNft.provider.getBalance(deployer)
                  console.log("deployer balance start", startDeployerBalance.toString())
                  const startcontractbalance = await randomIpfsNft.provider.getBalance(
                      randomIpfsNft.address
                  )

                  console.log("start contractBalance", startcontractbalance.toString())
                  await randomIpfsNft.requestNft({ value: MINT_FEE })
                  const contractbalance = await randomIpfsNft.provider.getBalance(
                      randomIpfsNft.address
                  )

                  console.log("contract balance after mint", contractbalance.toString())

                  const txResponse = await randomIpfsNft.withdraw()
                  const txReceipt = await txResponse.wait(1)

                  const contractbalanceAfterWithdraw = await randomIpfsNft.provider.getBalance(
                      randomIpfsNft.address
                  )

                  console.log(
                      "contract balance after withdraw",
                      contractbalanceAfterWithdraw.toString()
                  )

                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  //   const accounts = await ethers.getSigners()
                  //   const balance = await accounts[0].getBalance()

                  const deployerBalance = await randomIpfsNft.provider.getBalance(deployer)
                  const currentContractBalance = await randomIpfsNft.provider.getBalance(
                      randomIpfsNft.address
                  )

                  console.log(
                      "diff balance after withdraw",
                      deployerBalance.sub(startDeployerBalance).toString()
                  )

                  console.log("add balance after withdraw", deployerBalance.add(gasCost).toString())
                  console.log(
                      "expected deployer balance",
                      startDeployerBalance.add(contractbalance).toString()
                  )
                  console.log("dep balance ", deployerBalance.toString())
                  console.log("gas fee", gasCost.toString())
                  assert.equal(currentContractBalance.toString(), "0")
                  //   assert.equal(
                  //       deployerBalance.add(gasCost).toString(),
                  //       startDeployerBalance.add(MINT_FEE).toString()
                  //   )
              })
          })
      })
