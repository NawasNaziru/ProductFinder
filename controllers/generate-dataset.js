const fs = require('fs');
const path = require('path');
const util = require('util');
const getCaption = require('./image-captioning');
const query = require('./semantic-search.js');
const readFileIntoArray =  require('./seller-info')
const apiKey = process.env.HUGGINGFACE_API_KEY;


const readdir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

async function ocr(filename) {
    const data = fs.readFileSync(filename);
    const response = await fetch(
        "https://api-inference.huggingface.co/models/jinhybr/OCR-Donut-CORD",
        {
            headers: { Authorization: `Bearer ${apiKey}` },
            method: "POST",
            body: data,
        }
    );
    const result = await response.json();
    return result;
}

function extractTextFromOcrResponse(ocrResponse) {
    const regex = /<[^>]*>/g;
    let extractedText = ocrResponse[0]["generated_text"].replace(regex, ' ');
    return extractedText.trim(); // remove leading and trailing spaces
}


function generateDataset(directory, outputFilename, userInputLabels) {
    return new Promise((resolve, reject) => {
        const dataset = [];
        const failed_captions = [];
        let premier_caption = " ";

        // Check if the output file exists
        if (!fs.existsSync(outputFilename)) {
            // If the file doesn't exist, create it
            fs.writeFileSync(outputFilename, JSON.stringify([]));
        }

        fs.readFile(outputFilename, 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                const existingData = JSON.parse(data);
                dataset.push(...existingData);

                fs.readdir(directory, (err, files) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        const filePromises = files.map(file => {
                            const filePath = path.join(directory, file);

                            return new Promise((resolve, reject) => {
                                fs.readFile(filePath, (err, buffer) => {
                                    if (err) {
                                        console.error(err);
                                        reject(err);
                                    } else {
                                        const filename = path.basename(filePath);

                                        getCaption(filePath).then(caption => {
                                            console.log(caption);
                                            readFileIntoArray('./images/seller.txt').then(sellerFile => {
                                                if (!(Array.isArray(caption) && caption.length > 0 && caption.every(element => element["generated_text"]))) {
                                                    failed_captions.push(filename);
                                                } else {
                                                    const sellerFilePath = './images/seller.txt';
                                                    const sellerFileSize = fs.statSync(sellerFilePath).size;
                                                    if (sellerFileSize === 0) {
                                                        console.error("Seller txt file is empty");
                                                        reject("Seller txt file is empty");
                                                    } else {
                                                        // Perform semantic search and update the caption
                                                        query({
                                                            "inputs": {
                                                                "source_sentence": caption[0]["generated_text"],
                                                                "sentences": userInputLabels
                                                            }
                                                        }).then(response => {
                                                            // Find the index of the highest score
                                                            console.log("response is:", response);
                                                            const maxConfidence = Math.max(...response);
                                                            const highestScoreIndex = response.indexOf(Math.max(...response));
                                                            console.log("highestScoreIndex is:", highestScoreIndex);
                                                            // If the highest score is positive and the confidence is above 0 percent, add the corresponding label to the caption
                                                            if ((response[highestScoreIndex] > 0) && maxConfidence >= 0 ) {

                                                                premier_caption = userInputLabels[highestScoreIndex];
                                                                                   
                                                            }
                                                             
                                                            ocr(filePath).then(ocrResponse => {

                                                                if(!ocrResponse[0]["generated_text"]){
                                                                   console.log('ocr did not recognize any text or the ocr server is not responding')
                                                                }
                                                                
                                                                if(ocrResponse[0]["generated_text"]){
                                                                // Extract text from OCR response
                                                                const ocrText = extractTextFromOcrResponse(ocrResponse);
                                                                
                                                                // Append OCR text to the caption
                                                               if(ocrText){
                            
                                                                premier_caption = premier_caption + " " + `the text ${ocrText} is written on it`;
                                                                // Append generated caption to the end and remove leading/trailing spaces
                                                                caption[0]["generated_text"] = (premier_caption + " " + `${caption[0]["generated_text"]}`).trim();

                                                               }
                                                            }

                                                                const dataEntry = {
                                                                    sellerInfo: sellerFile,
                                                                    imageInfo: [
                                                                        { imageName: filename, descriptions: [caption[0]["generated_text"]] }
                                                                    ]
                                                                };
    
                                                                let existingObject = dataset.find(obj => JSON.stringify(obj.sellerInfo) === JSON.stringify(dataEntry.sellerInfo));
    
                                                                if (existingObject) {
                                                                    existingObject.imageInfo.push(dataEntry.imageInfo[0]);
                                                                } else {
                                                                    dataset.push(dataEntry);
                                                                    console.log("dataset is:", dataset)
                                                                }
                                                                resolve();
                                                            }).catch(err => {
                                                                console.error(err);
                                                                reject(err);
                                                            });
                                                        }).catch(err => {

                                                            console.log("Api not available or api rate exceeded or The input image has too many objects or undeleted items are in extracted folder generating too many requests per second more than the server capacity");
                                                            reject(err)
                                                        });
                                                    }
                                                }
                                            }).catch(err => {
                                                console.log(err);
                                                reject(err)
                                            });
                                        }).catch(err => {
                                            console.log(err);
                                            reject(err)
                                        });
                                    }
                                });
                            });
                        });
                        console.log("filepromises is:", filePromises);
                        Promise.all(filePromises).then(() => {
                            // Write the updated dataset to the output file
                            console.log("filepromises is:", filePromises)
                            fs.writeFileSync(outputFilename, JSON.stringify(dataset));
                            resolve({dataset, failed_captions});
                        }).catch(err => {
                            console.log(err);
                            reject(err)
                        });
                    }
                });
            }
        });
    });
}


module.exports = generateDataset;



/*function generateDataset(directory, outputFilename, userInputLabels) {
    return new Promise((resolve, reject) => {
        const dataset = [];
        const failed_captions = [];

        // Check if the output file exists
        if (!fs.existsSync(outputFilename)) {
            // If the file doesn't exist, create it
            fs.writeFileSync(outputFilename, JSON.stringify([]));
        }

        fs.readFile(outputFilename, 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                const existingData = JSON.parse(data);
                dataset.push(...existingData);

                fs.readdir(directory, (err, files) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        const filePromises = files.map(file => {
                            const filePath = path.join(directory, file);

                            return new Promise((resolve, reject) => {
                                fs.readFile(filePath, (err, buffer) => {
                                    if (err) {
                                        console.error(err);
                                        reject(err);
                                    } else {
                                        const filename = path.basename(filePath);

                                        getCaption(filePath).then(caption => {
                                            console.log(caption);
                                            readFileIntoArray('./images/seller.txt').then(sellerFile => {
                                                if (!(Array.isArray(caption) && caption.length > 0 && caption.every(element => element["generated_text"]))) {
                                                    failed_captions.push(filename);
                                                } else {
                                                    const sellerFilePath = './images/seller.txt';
                                                    const sellerFileSize = fs.statSync(sellerFilePath).size;
                                                    if (sellerFileSize === 0) {
                                                        console.error("Seller txt file is empty");
                                                        reject("Seller txt file is empty");
                                                    } else {
                                                        // Perform semantic search and update the caption
                                                        query({
                                                            "inputs": {
                                                                "source_sentence": caption[0]["generated_text"],
                                                                "sentences": userInputLabels
                                                            }
                                                        }).then(response => {
                                                            // Find the index of the highest score
                                                            console.log("response is:", response);
                                                            const maxConfidence = Math.max(...response);
                                                            const highestScoreIndex = response.indexOf(Math.max(...response));
                                                            console.log("highestScoreIndex is:", highestScoreIndex);
                                                            // If the highest score is positive and the confidence is above 0 percent, add the corresponding label to the caption
                                                            if ((response[highestScoreIndex] > 0) && maxConfidence >= 0 ) {
                                                                caption[0]["generated_text"] += ` which is ${userInputLabels[highestScoreIndex]}`;
                                                            }

                                                            const dataEntry = {
                                                                sellerInfo: sellerFile,
                                                                imageInfo: [
                                                                    { imageName: filename, descriptions: [caption[0]["generated_text"]] }
                                                                ]
                                                            };

                                                            let existingObject = dataset.find(obj => JSON.stringify(obj.sellerInfo) === JSON.stringify(dataEntry.sellerInfo));

                                                            if (existingObject) {
                                                                existingObject.imageInfo.push(dataEntry.imageInfo[0]);
                                                            } else {
                                                                dataset.push(dataEntry);
                                                                console.log("dataset is:", dataset)
                                                            }
                                                     
                                                            resolve();
                                                        }).catch(err => {

                                                            console.log("Api rate exceeded or The input image has too many objects or undeleted items are in extracted folder generating too many requests per second more than the server capacity");
                                                            reject(err)
                                                        });
                                                    }
                                                }
                                            }).catch(err => {
                                                console.log(err);
                                                reject(err)
                                            });
                                        }).catch(err => {
                                            console.log(err);
                                            reject(err)
                                        });
                                    }
                                });
                            });
                        });
                        console.log("filepromises is:", filePromises);
                        Promise.all(filePromises).then(() => {
                            // Write the updated dataset to the output file
                            console.log("filepromises is:", filePromises)
                            fs.writeFileSync(outputFilename, JSON.stringify(dataset));
                            resolve({dataset, failed_captions});
                        }).catch(err => {
                            console.log(err);
                            reject(err)
                        });
                    }
                });
            }
        });
    });
} */
/*
// delay between semantic search api calls to avoid server overloading
const Promise = require('bluebird'); // Import the bluebird library

function generateDataset(directory, outputFilename, userInputLabels) {
    return new Promise((resolve, reject) => {
        const dataset = [];
        const failed_captions = [];

        // Check if the output file exists
        if (!fs.existsSync(outputFilename)) {
            // If the file doesn't exist, create it
            fs.writeFileSync(outputFilename, JSON.stringify([]));
        }

        fs.readFile(outputFilename, 'utf8', (err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                const existingData = JSON.parse(data);
                dataset.push(...existingData);

                fs.readdir(directory, (err, files) => {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        const filePromises = files.map((file, index) => {
                            const filePath = path.join(directory, file);

                            return new Promise((resolve, reject) => {
                                fs.readFile(filePath, (err, buffer) => {
                                    if (err) {
                                        console.error(err);
                                        reject(err);
                                    } else {
                                        const filename = path.basename(filePath);

                                        getCaption(filePath).then(caption => {
                                            console.log(caption);
                                            readFileIntoArray('./images/seller.txt').then(sellerFile => {
                                                if (!(Array.isArray(caption) && caption.length > 0 && caption.every(element => element["generated_text"]))) {
                                                    failed_captions.push(filename);
                                                } else {
                                                    const sellerFilePath = './images/seller.txt';
                                                    const sellerFileSize = fs.statSync(sellerFilePath).size;
                                                    if (sellerFileSize === 0) {
                                                        console.error("Seller txt file is empty");
                                                        reject("Seller txt file is empty");
                                                    } else {
                                                        // Perform semantic search and update the caption
                                                        Promise.delay(index * 1000) // Add a delay before each request
                                                            .then(() => query({
                                                                "inputs": {
                                                                    "source_sentence": caption[0]["generated_text"],
                                                                    "sentences": userInputLabels
                                                                }
                                                            }))
                                                            .then(response => {
                                                                // Find the index of the highest score
                                                                console.log("response is:", response);
                                                                const highestScoreIndex = response.indexOf(Math.max(...response));
                                                                console.log("highestScoreIndex is:", highestScoreIndex);
                                                                // If the highest score is positive, add the corresponding label to the caption
                                                                if (response[highestScoreIndex] > 0) {
                                                                    caption[0]["generated_text"] += ` which is ${userInputLabels[highestScoreIndex]}`;
                                                                }
                                                                // ... rest of your code
                                                            }).catch(err => reject(err));
                                                    }
                                                }
                                            }).catch(err => reject(err));
                                        }).catch(err => reject(err));
                                    }
                                });
                            });
                        });

                        Promise.all(filePromises).then(() => {
                            // Write the updated dataset to the output file
                            fs.writeFileSync(outputFilename, JSON.stringify(dataset));
                            resolve();
                        }).catch(err => reject(err));
                    }
                });
            }
        });
    });
}

*/