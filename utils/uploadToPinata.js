const pinataSDK = require("@pinata/sdk")
const fs = require("fs")
const path = require("path")
require("dotenv").config()

const pinataAPIKey = process.env.PINATA_API_KEY
const pinataAPISecret = process.env.PINATA_API_SECRET
const pinata = new pinataSDK(pinataAPIKey, pinataAPISecret)

async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath)
    console.log("full image path", fullImagesPath)
    const files = fs.readdirSync(fullImagesPath)
    console.log(files)

    let responses = []
    for (fileIndex in files) {
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`)
        console.log("readable strea ", readableStreamForFile)
        const options = {
            pinataMetadata: {
                name: files[fileIndex],
            },
        }
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile, options)
            console.log("pinata response ", response)
            responses.push(response)
        } catch (e) {
            console.log("error ", e)
        }
    }

    return { responses, files }
}

async function storeTokenUriMetadata(tokenMetadata) {
    try {
        const response = await pinata.pinJSONToIPFS(tokenMetadata)
        console.log("response pin json", response)
        return response
    } catch (e) {
        console.log("error ", e)
    }

    return null
}

module.exports = { storeImages, storeTokenUriMetadata }
