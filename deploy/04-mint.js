const { network, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    INITIAL_ANSWER,
    DECIMALS,
} = require("../helper-hardhat-config")

module.exports = async ({ getNamedAccounts }) => {
    const deployer = (await getNamedAccounts()).deployer
    const chainId = network.config.chainId

    //Basic NFT
    const basicNft = await ethers.getContract("BasicNFT", deployer)
    const basicMint = await basicNft.mintNft()
    await basicMint.wait(1)

    console.log("Basic NFT Index 0 Token URI", await basicNft.tokenURI(0))

    //RandomIpfsNft

    const randomIpfs = await ethers.getContract("RandomIpfsNft", deployer)
    const mintFee = await randomIpfs.getMintFee()
    const randomIpfsRequestNft = await randomIpfs.requestNft({ value: mintFee })
    const randomIpfsRequestNftTxReceipt = await randomIpfsRequestNft.wait(1)

    //create listener for get response
    await new Promise(async (resolve, reject) => {
        setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000)

        randomIpfs.once("NftMinted", async () => {
            console.log(`Random IPFS NFT index 0 tokenURI: ${await randomIpfs.tokenURI(0)}`)
            resolve()
        })

        if (chainId == 31337) {
            const requestId = randomIpfsRequestNftTxReceipt.events[1].args.requestId.toString()
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfs.address)
        }
    })

    //Dynamic NFT
    const dynamicNft = await ethers.getContract("DynamicSvgNft", deployer)
    const highValue = ethers.utils.parseEther("4000")
    const dynamicNftMint = await dynamicNft.mintNFT(highValue)
    await dynamicNftMint.wait(1)

    console.log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicNft.tokenURI(0)}`)
}

module.exports.tags = ["all", "mint"]
