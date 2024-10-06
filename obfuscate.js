const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

// Directory path where the .js file is located
const directoryPath = __dirname; // Change this to your desired directory if needed

// Specify the target file to obfuscate
const targetFile = "cookie-consent.js";

// Function to obfuscate the specified JavaScript file
fs.readFile(path.join(directoryPath, targetFile), "utf8", (err, data) => {
  if (err) {
    return console.log(`Error reading file ${targetFile}:`, err);
  }

  // Obfuscate the JavaScript content
  const obfuscationResult = JavaScriptObfuscator.obfuscate(data, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    numbersToExpressions: true,
    simplify: true,
    stringArrayShuffle: true,
    splitStrings: true,
    stringArrayThreshold: 1,
  });

  // Write the obfuscated content to 'cookie-consent-min.js'
  const newFileName = "cookie-consent-min.js";
  fs.writeFile(
    path.join(directoryPath, newFileName),
    obfuscationResult.getObfuscatedCode(),
    (err) => {
      if (err) {
        console.log(`Error writing to file ${newFileName}:`, err);
      } else {
        console.log(`File ${newFileName} created and obfuscated successfully!`);
      }
    }
  );
});
