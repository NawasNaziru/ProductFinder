// Import the AWS SDK
const aws = require('aws-sdk');
var fs = require('fs');
var path = require('path');

// Set up AWS SDK and create an S3 instance
aws.config.loadFromPath(__dirname + '/../config/aws-config.json');
aws.config.update({region: 'us-east-1'}); // replace 'your-region' with your actual AWS region
const s3 = new aws.S3({apiVersion: '2006-03-01'});

// Function to upload a file to S3
async function uploadFileToS3(bucketName, filePath, keyPrefix = 'data/feidegger/fashion/'){
  // Read content from the file
  const fileContent = fs.readFileSync(filePath);

  // Setting up S3 upload parameters
  const params = {
      Bucket: bucketName,
      Key: keyPrefix + path.basename(filePath), // File name you want to save as in S3
      Body: fileContent
  };

  // Uploading files to the bucket
  s3.upload(params, function(err, data) {
      if (err) {
          throw err;
      }
      console.log(`File uploaded successfully. ${data.Location}`);
  });
};

// Function to upload all files in a directory
async function uploadDirectoryToS3(bucketName, directoryPath){
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
        throw err;
    }

    // Loop through all the files in the directory
    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        uploadFileToS3(bucketName, filePath);
    }
  });
};

module.exports = {uploadFileToS3, uploadDirectoryToS3};




/*const aws = require('aws-sdk');
var fs = require('fs');
var path = require('path');

// Set up AWS SDK and create an S3 instance
aws.config.loadFromPath(__dirname + '/../config/aws-config.json');
aws.config.update({region: 'us-east-1'}); // replace 'your-region' with your actual AWS region
const s3 = new aws.S3({apiVersion: '2006-03-01'});

// Function to upload a file to S3
async function uploadFileToS3(bucketName, filePath){
  // Read content from the file
  const fileContent = fs.readFileSync(filePath);

  // Setting up S3 upload parameters
  const params = {
      Bucket: bucketName,
      Key: 'data/images/' + path.basename(filePath), // File name you want to save as in S3
      Body: fileContent
  };

  // Uploading files to the bucket
  s3.upload(params, function(err, data) {
      if (err) {
          throw err;
      }
      console.log(`File uploaded successfully. ${data.Location}`);
  });
};

module.exports = uploadFileToS3; */


