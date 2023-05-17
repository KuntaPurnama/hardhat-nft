const { network, ethers } = require("hardhat")
const {
    developmentChains,
    networkConfig,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config")
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata")
require("dotenv").config()
const { verify } = require("../utils/verify")

const FUND_AMOUNT = "1000000000000000000000"
const imagesLocation = "./images/randomNft/"
let tokenUris = [
    "ipfs://QmQt6RchBQKnSBZjzhZ66nF7YSnDSMrQo6RgPLmk3HMXHq",
    "ipfs://QmauHJ8nGCJJqdy1dGfFiwcp36PzvTkFS3QCj4BT8iWsL4",
    "ipfs://QmW9ToN3WZkrERrVe8Xdigr15FAPDBkpCEj4KC5p5yHJNR",
]
// const imageUris = [
//     "ipfs://QmSsYRx3LpDAb1GZQm7zZ1AuHZjfbPkD6J7s9r41xu1mf8",
//     "ipfs://QmYx6GsYAKnNzZ9A6NvEKV9nf1VaDzJrqDR23Y8YSkebLU",
//     "ipfs://QmUPjADFGEKmfohdTaNcWhp7VGk26h5jXDA7v3VtTnTLcW",
// ]

const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        },
    ],
}

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const deployer = (await getNamedAccounts()).deployer
    const chainId = network.config.chainId
    let vrfCoordinatorV2MockAddress, subscriptionId, vrfCoordinatorV2Mock

    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris()
    }

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2MockAddress = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId

        // Fund the subscription
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2MockAddress = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
    }

    log("----------------------------")
    // await storeImages(imagesLocation)
    const arguments = [
        vrfCoordinatorV2MockAddress,
        subscriptionId,
        networkConfig[chainId]["gasLane"],
        networkConfig[chainId]["callbackGasLimit"],
        tokenUris,
        networkConfig[chainId]["mintFee"],
    ]

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    console.log("deploy RandomIpfsNft")
    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: arguments,
        log: true,
        waitBlockConfirmations: waitBlockConfirmations,
    })

    if (developmentChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address)
    }

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(randomIpfsNft.address, arguments)
    }

    log("DONE!!!!!!")
}

async function handleTokenUris() {
    const tokenUris = []
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    console.log("Uploading Metadata....")
    for (imageUploadResponsesId in imageUploadResponses) {
        let tokenMetadata = { ...metadataTemplate }
        tokenMetadata.name = files[imageUploadResponsesId].replace(".png", "")
        tokenMetadata.description = `An adorable ${tokenMetadata.name} pub`
        tokenMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponsesId].IpfsHash}`

        const metadataUploadResponse = await storeTokenUriMetadata(tokenMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }

    console.log("Token URIs Uploaded : ", tokenUris)
    return tokenUris
}

module.exports.tags = ["all", "main", "randomIpfs"]
