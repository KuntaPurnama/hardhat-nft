const { network, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    INITIAL_ANSWER,
    DECIMALS,
} = require("../helper-hardhat-config")
const fs = require("fs")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const deployer = (await getNamedAccounts()).deployer
    const chainId = network.config.chainId
    const frownSVG = fs.readFileSync("./images/dynamicNft/frown.svg", { encoding: "utf8" })
    const happySVG = fs.readFileSync("./images/dynamicNft/happy.svg", { encoding: "utf8" })
    console.log("low svg : ", frownSVG)

    let ethUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks")
        const mockV3Aggregator = await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        })
        ethUsdPriceFeedAddress = mockV3Aggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    log("----------------------------")
    const arguments = [ethUsdPriceFeedAddress, frownSVG, happySVG]
    const waitBlockConfirmation = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    const dynamicSvgNft = await deploy("DynamicSvgNft", {
        contract: "DynamicSvgNft",
        from: deployer,
        log: true,
        args: arguments,
        waitBlockConfirmation: waitBlockConfirmation,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(dynamicSvgNft.address, arguments)
    }

    log("DONE!!!!!!")
}

module.exports.tags = ["all", "main", "dynamicSvg"]
