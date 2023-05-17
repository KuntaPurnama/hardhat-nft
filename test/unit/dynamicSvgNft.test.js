const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const fs = require("fs")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Dynamic SVG NFT", function () {
          let deployer, dynamicSvgNft, mockV3Aggregator
          const baseUrl = "data:image/svg+xml;base64,"
          const frownSVG = fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf8" })
          const happySVG = fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf8" })
          const lowImageEncoded = baseUrl + btoa(frownSVG)
          const highImageEncoded = baseUrl + btoa(happySVG)

          const baseTokenURI = "data:application/json;base64,"

          //   abi.encodePacked(
          //       '{"name":"',
          //       name(), // You can add whatever name here
          //       '", "description":"An NFT that changes based on the Chainlink Feed", ',
          //       '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
          //       imageURI,
          //       '"}'
          //   )

          const lowSvgTokenURI = `{"name":"Dynamic SVG NFT", "description":"An NFT that changes based on the Chainlink Feed", "attributes": [{"trait_type": "coolness",
           "value": 100}], "image":"${lowImageEncoded}"}`
          const highSvgTokenURI = `{"name":"Dynamic SVG NFT", "description":"An NFT that changes based on the Chainlink Feed", "attributes": [{"trait_type": "coolness",
           "value": 100}], "image":"${highImageEncoded}"}`

          const highSvgTokenURIAlt =
              "data:application/json;base64,eyJuYW1lIjoiRHluYW1pYyBTVkcgTkZUIiwgImRlc2NyaXB0aW9uIjoiQW4gTkZUIHRoYXQgY2hhbmdlcyBiYXNlZCBvbiB0aGUgQ2hhaW5saW5rIEZlZWQiLCAiYXR0cmlidXRlcyI6IFt7InRyYWl0X3R5cGUiOiAiY29vbG5lc3MiLCAidmFsdWUiOiAxMDB9XSwgImltYWdlIjoiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCMmFXVjNRbTk0UFNJd0lEQWdNakF3SURJd01DSWdkMmxrZEdnOUlqUXdNQ0lnSUdobGFXZG9kRDBpTkRBd0lpQjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaVBnb2dJRHhqYVhKamJHVWdZM2c5SWpFd01DSWdZM2s5SWpFd01DSWdabWxzYkQwaWVXVnNiRzkzSWlCeVBTSTNPQ0lnYzNSeWIydGxQU0ppYkdGamF5SWdjM1J5YjJ0bExYZHBaSFJvUFNJeklpOCtDaUFnUEdjZ1kyeGhjM005SW1WNVpYTWlQZ29nSUNBZ1BHTnBjbU5zWlNCamVEMGlOakVpSUdONVBTSTRNaUlnY2owaU1USWlMejRLSUNBZ0lEeGphWEpqYkdVZ1kzZzlJakV5TnlJZ1kzazlJamd5SWlCeVBTSXhNaUl2UGdvZ0lEd3ZaejRLSUNBOGNHRjBhQ0JrUFNKdE1UTTJMamd4SURFeE5pNDFNMk11TmprZ01qWXVNVGN0TmpRdU1URWdOREl0T0RFdU5USXRMamN6SWlCemRIbHNaVDBpWm1sc2JEcHViMjVsT3lCemRISnZhMlU2SUdKc1lXTnJPeUJ6ZEhKdmEyVXRkMmxrZEdnNklETTdJaTgrQ2p3dmMzWm5QZz09In0="

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
              mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
          })

          describe("constructor", function () {
              it("test constructor call", async function () {
                  const lowImageNFT = await dynamicSvgNft.getLowSVG()
                  const highImageNFT = await dynamicSvgNft.getHighSVG()
                  const priceFeed = await dynamicSvgNft.getPriceFeed()

                  assert.equal(lowImageEncoded, lowImageNFT)
                  assert.equal(highImageEncoded, highImageNFT)
                  assert.equal(mockV3Aggregator.address, priceFeed)
              })
          })

          describe("SVG To Image URI", function () {
              it("svgToImageURI", async function () {
                  const test = "test"
                  const testBase64 = await dynamicSvgNft.svgToImageURI(test)
                  const testBase64JS = baseUrl + btoa(test)

                  assert.equal(testBase64, testBase64JS)
              })
          })

          describe("Mint NFT", function () {
              it("mintNFT success", async function () {
                  const highValue = ethers.utils.parseEther("1") // 1 dollar per ether
                  await expect(dynamicSvgNft.mintNFT(highValue)).to.be.emit(
                      dynamicSvgNft,
                      "CreatedNFT"
                  )
                  const highValueTokenId = await dynamicSvgNft.getTokenIdToHighValue(0)
                  const tokenCounter = await dynamicSvgNft.getTokenCounter()

                  assert.equal(highValue.toString(), highValueTokenId.toString())
                  assert.equal(1, tokenCounter)

                  //   const highSvgTokenURIEncoded = baseTokenURI + btoa(highSvgTokenURI)
                  //   const lowSvgTokenURIEncoded = baseTokenURI + btoa(lowSvgTokenURI)
                  const tokenURI = await dynamicSvgNft.tokenURI(0)
                  //   console.log("token URI", tokenURI)
                  //   assert.equal(tokenURI, lowSvgTokenURIEncoded)
                  assert.equal(tokenURI, highSvgTokenURIAlt)
              })

              it("mintNFT Token Id not Exists", async function () {
                  await expect(dynamicSvgNft.tokenURI(0)).to.be.revertedWith(
                      "ERC721Metadata__URI_QueryFor_NonExistentToken"
                  )
              })
          })
      })
