

module.exports = function (app) {

	
	var aws = require('aws-sdk');
	var mv = require('mv');
	var fs = require('fs');
	const sharp = require('sharp');
	const Jimp = require('jimp'); 
    const FormData = require('form-data');
	const path = require('path');
	const axios = require('axios');
	const fsExtra = require("fs-extra");
	const apiKey = process.env.HUGGINGFACE_API_KEY;

	require('dotenv').config();

	const dir = './extracted';
	const files = fs.readdirSync(dir).filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.gif') || file.endsWith('.bmp'));
	// require Helper functions
	var helper = require('./helpers');

	const generateDataset = require('./generate-dataset.js');
	const query = require('./semantic-search.js');


	// load UI data model
	var ui = require('../models/uiDataModel');

	// setup bodyparser
	var bodyParser = require('body-parser');
	app.use(bodyParser.json()) // support json encoded bodies
	app.use(
		bodyParser.urlencoded({
			extended: true
		})
	) // support encoded bodies



	// serve up main page
	app.get('/', function (req, res, next) {

		helper.resetUI()

		// ui flow
		ui.flow.timestamp = new Date(Date.now())

		res.setHeader('Content-Type', 'text/html')
		res.render('./index.ejs', {
			ui: ui
		})

	})
	

	
	app.post("/seller", (req, res) => {
		// Get the file name from the request body
		let fileName = req.body.filename;
		// Remove the file extension from the file name
		let sellerName = fileName.slice(0, -4);
		// Construct the path to the folder with the same name as the file inside the 'sellers' folder
		let sellerFolder = path.resolve(__dirname, "..", "sellers", sellerName);
		// Construct the path to the destination folder inside the 'images' folder
		let destFolder = path.resolve(__dirname, "..", "images");
		// Construct the path to the masterDB folder
		let masterDB = path.resolve(__dirname, "..", "masterDB");
	  
		// Check if the seller folder exists on the server
		if (fs.existsSync(sellerFolder)) {
		  // Read the files in the seller folder
		  let files = fs.readdirSync(sellerFolder);
		  // Delete the destination folder if it exists
		  if (fs.existsSync(destFolder)) {
			fs.rmSync(destFolder, { recursive: true, force: true });
		  }
		  // Create a new destination folder with the same name
		  fs.mkdirSync(destFolder);
		  // Loop through the files
		  for (let file of files) {
			// Construct the source and destination paths for each file
			let src = path.join(sellerFolder, file);
			let dest = path.join(destFolder, file);
			// Read the file content from the source
			let data = fs.readFileSync(src);
			// Write the file content to the destination
			fs.writeFileSync(dest, data);
		  }
		  // Construct the file name with the txt extension
		  let txtFile = sellerName + ".txt";
		  // Construct the source and destination file paths for the txt file
		  let srcFile = path.join(destFolder, txtFile);
		  let destFile = path.join(destFolder, "seller.txt");
		  // Check if the source file exists
		  if (fs.existsSync(srcFile)) {
			// Rename the file from the source to the destination
			fs.renameSync(srcFile, destFile);
		  }
		  // Move the seller folder to the masterDB folder
		  fs.renameSync(sellerFolder, path.join(masterDB, sellerName));
		  // Send a success message as a response
		  res.send("Copied and replaced all files from " + sellerName + " folder" + " to images folder, renamed the "  + sellerName + ".txt file to seller.txt, and moved the "  + sellerName + " folder to masterDB folder");
		} else {
		  // Send an error message if the seller folder does not exist
		  res.status(404).send("Seller folder not found");
		}
	  });


	  app.post('/query', (req, res, next) => {

		let source = req.body.inputText;
		let location = req.body.location; // Access the location from the request body
	
		var readDataset = function(){ 
			return new Promise((resolve, reject) => { 
				fs.readFile('./metadata.json', 'utf8', (err, jsonString) => {
					if (err) {
						console.log("Error reading file from disk:", err);
						reject(err); // Reject the promise with the error
					}
					try {
						// Parse the JSON file
						const data = JSON.parse(jsonString);
				
						// Construct the 'imageInfo' key value
						let imageInfo = data.flatMap(item => {
							return item.imageInfo.map(info => {
								return {
									imageName: info.imageName,
									descriptions: info.descriptions
								};
							});
						});
						
						let sentences = imageInfo.map(info => info.descriptions[0]);
						
						console.log(sentences);
						// Construct the data to be sent to the Hugging Face API
						let apiData = {
							"inputs": {
								"source_sentence": source,
								"sentences": sentences
							}
						};
				
						resolve({data, apiData, sentences}); // Resolve the promise with the values
				
					} catch(err) {
						console.log('Error parsing JSON string:', err);
						reject(err); // Reject the promise with the error
					}
				})
			});
		}
		
		
	
		readDataset().then(({data, apiData, sentences}) => {

			 
             // Split the source into individual words
           let sourceWords = source.toLowerCase().split(' ');

		   let exactMatchImageNames = [];
		   let sellersDetailsExactMatch = [];

            // Perform case-insensitive exact-match search
           let exactMatches = sentences.filter(sentence => {
              let sentenceWords = sentence.toLowerCase().split(' ');
              return sourceWords.every(word => sentenceWords.includes(word));
           });


          // If exact matches are found, retrieve imageNames for each match and push to imageNames array
        if (exactMatches.length > 0) {
			 // Sort the matches by their length and pick the top 10
			 exactMatches.sort((a, b) => b.length - a.length);
			 exactMatches = exactMatches.slice(0, 10);

			// Retrieve imageNames for each match

          exactMatches.forEach(match => {
            const obj = data.find(item => {
							return item.imageInfo.some(info => 
								info.descriptions.includes(match) &&
								(item.sellerInfo[2].toLowerCase().includes(location.toLowerCase()) ||
								item.sellerInfo[3].toLowerCase().includes(location.toLowerCase()))
							);
						});
						if (obj != null) {
							const imageName = obj.imageInfo.find(info => info.descriptions.includes(match)).imageName;
							console.log(imageName);
							exactMatchImageNames.push(imageName);
							const sellerDetails = obj.sellerInfo;
							sellersDetailsExactMatch.push(sellerDetails);
						}
          });
       }


       // Proceed to semantic search
			query(apiData).then((response) => {
				console.log(response);
				if (!Array.isArray(response) || !response.length) {
					ui.data.notrecognized = "Product Not Found ";
					//reset some ui components
					ui.data.prodImage = " ";
					ui.data.images = [];
					ui.data.filename = null;
					// render the ui
					res.render('./index.ejs', {
						ui: ui
					})
				}
				let semanticMatchImageNames = [];
				let sellersDetailsSemanticSearch = [];	 
		
				for (let i = 0; i < 20; i++) {
					const maxIndex = response.indexOf(Math.max(...response));
					if (maxIndex !== -1) {
						const matchingCaption =  sentences[maxIndex];
						const obj = data.find(item => {
							return item.imageInfo.some(info => 
								info.descriptions.includes(matchingCaption) &&
								(item.sellerInfo[2].toLowerCase().includes(location.toLowerCase()) ||
								item.sellerInfo[3].toLowerCase().includes(location.toLowerCase()))
							);
						});
						if (obj != null) {
							const imageName = obj.imageInfo.find(info => info.descriptions.includes(matchingCaption)).imageName;
							console.log(imageName);
							semanticMatchImageNames.push(imageName);
							const sellerDetails = obj.sellerInfo;
							sellersDetailsSemanticSearch.push(sellerDetails);
						}
						response.splice(maxIndex, 1);
					} else {
						break;
					}
				}
		
				// Interleave the results from the exact-match search and the semantic search
				let imageNames = [];
				let sellersDetailsArray = [];
				for (let i = 0; i < Math.max(exactMatchImageNames.length, semanticMatchImageNames.length); i++) {
					if (i < exactMatchImageNames.length) {
						imageNames.push(exactMatchImageNames[i]);
						sellersDetailsArray.push(sellersDetailsExactMatch[i]);
					}
					if (i < semanticMatchImageNames.length) {
						imageNames.push(semanticMatchImageNames[i]);
						sellersDetailsArray.push(sellersDetailsSemanticSearch[i]);
					}
				}

				if (imageNames.length == 0) {
					ui.data.error = "No matching product found";
					res.render('./error-display.ejs', {
						ui: ui
					});
				}
		
				if (sellersDetailsArray.length == 0) {
					ui.data.error = "No seller info found";
					res.render('./error-display.ejs', {
						ui: ui
					});
				}
		
				ui.data.seller = sellersDetailsArray;
				ui.data.prodImage = imageNames;
				ui.data.images = [];
				ui.data.notrecognized = " ";
				ui.data.filename = null;
				res.render('./index.ejs', {
					ui: ui
				})
		
			}).catch(error => {
				ui.data.error = error;
				res.render('./error-display.ejs', {
					ui: ui}, (err) => {
						if (err) return next(err);
					}
				);
			});
		})		
		
	});


	// process image
	app.post('/rekog', function (req, res) {

        //helper.resetUI();
		ui.data.prodImage = [];
		ui.data.notrecognized = " ";
		ui.data.seller = [];
		ui.data.failed_captions = [];
        ui.data.error = [];
		ui.data.image_labels = req.body.imageLabels.split(',');
		ui.flow.activateDiv = ui.flow.activateDiv || 'label-result-div';
		ui.flow.activateButton = ui.flow.activateButton || 'label-button';
		ui.data.filename = req.body.filename;
        
		var file = __dirname + '/../images/' + req.body.filename;

		// Define the directory for the extracted images
		var dir = __dirname + '/../extracted/';



		var loadImage = function () {
			return new Promise(function (resolve, reject) {
	
			fs.access(file, fs.constants.F_OK, (err) => {
				if (err) {
				  // File not found, display error message
				  ui.data.error = "Select file for segmentation ONLY from the images folder in ProductFinder path";
				  res.render('./error-display.ejs', {
					  ui: ui
				  });
				}
			});
	
			if (ui.debuginfo) console.log('==> reading image from file ' + file)
	
			//this will run async
			fs.readFile(file, (err, data) => {
	
				// file error?
				if (err) reject(err)
				else {
					// Convert the image buffer to a base64 string
					let base64String = data.toString('base64');
					// Resolve the promise with the base64 string
					resolve(base64String);
				}
			})
			  
		})
	}
	
	

var storeImages = function(inputImage, bounding_boxes, full_image){
    
    // If the directory doesn't exist, create it
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    // Load the image
    return sharp(inputImage)
      .toBuffer()
      .then((data) => {
        return Jimp.read(data).then((image) => {
          let promises = [];
          if (full_image) {
            // Save the full image directly
            promises.push(new Promise((resolve, reject) => {
              let timestamp = new Date().getTime();
              let fileName = `fullImage_${timestamp}.jpg`;
              let filePath = path.join(dir, fileName);
              image.write(filePath, (err) => {
                if (err) reject(err);
                else resolve(fileName); // Resolve with the file name
              });
            }));
          } else if (bounding_boxes) {
            // For each bounding box, display the object in the image
            promises = bounding_boxes.map((box, i) => {
              // Extract the object from the image using the bounding box coordinates
              const obj = image.clone().crop(box['xmin'], box['ymin'], box['xmax'] - box['xmin'], box['ymax'] - box['ymin']);

              // Save the object to a file in the extracted directory
              return new Promise((resolve, reject) => {
                let timestamp = new Date().getTime();
                let fileName = `object${i + 1}_${timestamp}.jpg`;
                let filePath = path.join(dir, fileName);
                obj.write(filePath, (err) => {
                  if (err) reject(err);
                  else resolve(fileName); // Resolve with the file name
                });
              });
            });
          }

          // Return a Promise that resolves when all images have been saved
          // The promise will resolve with an array of file names
          return Promise.all(promises);
        });
      });
};

var detectLabels = async function (imageFilePath) {
    try {
        // Read the image file
        const imageBase64 = fs.readFileSync(imageFilePath);

        // Send the POST request to Hugging Face API
        const response = await fetch(
            "https://api-inference.huggingface.co/models/facebook/detr-resnet-101",
            {
                headers: { Authorization: `Bearer ${apiKey}` },
                method: 'POST',
                body: imageBase64
            }
        );

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response body as JSON
        const results = await response.json();

        // Extract only the bounding boxes from the results
        const boundingBoxes = results.map(result => result.box);

        // Return the array of bounding boxes
        return boundingBoxes;
    } catch (error) {
        // Log and re-throw the error
        console.error(error);
        throw error;
    }
};
    
		
	// detect image labels
	/*var detectLabels = function (imageBase64, candidateLabels) {
		return new Promise(function (resolve, reject) {
			// Create the request body
			const body = {
				image: imageBase64,
				labels: candidateLabels
			};
	
			// Send the POST request
			//http://localhost:5000/
			fetch(' http://192.168.219.5:5000/detect_objects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			})
			.then(response => {
				// Check if the request was successful
				if (!response.ok) {
					reject(`HTTP error! status: ${response.status}`);
				}
				// Parse the response body as JSON
				return response.json();
			})
			.then(boundingBoxes => {
				// The Promise resolves with the bounding boxes
				resolve(boundingBoxes);
			})
			.catch(error => {
				// The Promise rejects with the error
				console.log(error);
				reject(error);
			});
		});
	}*/
		
		  
		// main controller logic - load the file, then call recog APIs in parallel, collect promises and render screen

		// loadimage - on promise resolved,  call detectlabels and detecttext functions
	loadImage(file).then(async function resolveLoadImage(buffer) {
				
				Promise.all([detectLabels(file, ui.data.image_labels)]).then(function resolveAll(arr) {
					console.log('bbxs:', arr[0]);
				 if (arr[0].length === 0) {
					ui.data.images = [];
					ui.data.prodImage = [];
					ui.data.notrecognized = "No item recognized";
					res.render('./index.ejs', { ui: ui });
				} else {
				 storeImages(file, arr[0]).then(async (images) => {
					console.log('images:', images);
				   generateDataset(dir, 'metadata.json', ui.data.image_labels).then(result => {
					console.log('result:', result);
					  if (result.dataset == "Seller txt file is empty"){
						ui.data.error = result.dataset;
						res.render('./error-display.ejs', {
							ui: ui
						  });
					  }
			          else{
					   console.log('Dataset written to metadata.json');
					   // Move all files in the extracted dir to the productsImages folder
                       let productsImages = path.resolve(__dirname, "..", "productsImages");
                       fs.readdir(dir, (err, files) => {
                       if (err) throw err;
                       for (let file of files) {
                        fs.rename(path.join(dir, file), path.join(productsImages, file), err => {
                          if (err) throw err;
                       });
                       }
                      });
					  
					  // Get the source file path
					  const sourceFile = path.join(__dirname, '..', 'images', req.body.filename);
					  
					  // Get the destination folder path
					  const destinationFolder = path.resolve(__dirname, '..', 'temp');
					  
					  // Empty the destination folder if it exists


                      if (fs.existsSync(destinationFolder)) {
                      // Get the list of files in the folder
                       fs.readdir(destinationFolder, (err, files) => {
                       if (err) {
                        console.error('Error reading folder:', err);
                   // Handle the error appropriately, e.g., send an error response
                       } else {
                               // Delete each file in the folder
                               files.forEach(file => {
                               fs.unlink(path.join(destinationFolder, file), (err) => {
                               if (err) {
                               console.error('Error deleting file:', err);
                                 // Handle the error appropriately, e.g., send an error response
                                     }
                                 });
                            });
                                 // Remove the folder itself
                              /*fs.rm(destinationFolder, { recursive: true, force: true }, (err) => {
                                   if (err) {
                                  console.error('Error removing folder:', err);
                                 // Handle the error appropriately, e.g., send an error response
                                }
                              });*/
						  }
						});
					  }
					  
					  // Create the destination folder
					  //fs.mkdirSync(destinationFolder, { recursive: true });
					  
					  // Construct the destination file path
					  const destinationFile = path.join(destinationFolder, req.body.filename);
					  
					  // Move the file using fs.rename()
					  fs.rename(sourceFile, destinationFile, (err) => {
					   if (err) {
					    console.error('Error moving file:', err);
					    // Handle the error appropriately, e.g., send an error response
					   } else {
					    console.log('File moved successfully!');
					    // Handle successful move, e.g., send a success response
					   }
					  });
					  
					   ui.data.images = images;
					   ui.data.failed_captions = result.failed_captions;
					   res.render('./index.ejs', {
						ui: ui
					  });
					}
		        }).catch((err) => {
					fs.readdir(dir, (err, files) => {
					  if (err) throw err;
				  
					  // Create a promise for each delete operation
					  let deletePromises = files.map(file => {
						return new Promise((resolve, reject) => {
						  fs.unlink(path.join(dir, file), err => {
							if (err) reject(err);
							else resolve();
						  });
						});
					  });
				  
					  // Wait for all delete operations to complete
					  Promise.all(deletePromises)
						.then(() => {
						  ui.data.error = err;
						  res.render('./error-display.ejs', { ui: ui });
						})
						.catch((err) => {
						  // Handle any errors that occurred while deleting files
						  console.error(err);
						});
					});
				  });				  
              })
              .catch((err) => {
				ui.data.error = err;
				res.render('./error-display.ejs', {
					ui: ui
				});
              });

		      }},
					// promise error - from either detectLabels, detectText
					function rejectAll(err) {
						ui.data.images = err;
						ui.data.error = err;
				        res.render('./error-display.ejs', {
					     ui: ui
				});
			})

			}, // loadmimage promise err
			function rejectLoadImage(err) {
				ui.data.images = err
				ui.data.error = err;
				res.render('./error-display.ejs', {
					ui: ui
				});
			})

	})
}
