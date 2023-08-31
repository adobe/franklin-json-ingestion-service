/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
// Read the ZIP file and extract its contents
const globalString = 'global.__rootdir = dirname(__filename);';

async function extractZipAsync(zipFilePath, outputDir) {
  try {
    const zip = new AdmZip(zipFilePath);
    const entries = zip.getEntries();

    for (const entry of entries) {
      if (!entry.isDirectory) {
        const entryData = entry.getData();
        const outputPath = path.join(outputDir, entry.entryName);
        // eslint-disable-next-line no-await-in-loop
        await fs.writeFile(outputPath, entryData);
        // eslint-disable-next-line no-console
        console.log(`Extracted: ${entry.entryName}`);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error extracting ZIP:', err);
    throw err;
  }
}

async function zipDirectoryAsync(sourceDir, outputZipPath) {
  try {
    const zip = new AdmZip();

    const files = await fs.readdir(sourceDir);

    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      // eslint-disable-next-line no-await-in-loop
      const fileData = await fs.readFile(filePath);
      zip.addFile(file, fileData);
    }

    zip.writeZip(outputZipPath);
    // eslint-disable-next-line no-console
    console.log(`Directory ${sourceDir} zipped to ${outputZipPath}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error zipping directory:', err);
    throw err;
  }
}

const createTempDir = async () => fs.mkdtemp(path.join(os.tmpdir(), 'zip-extraction-'));

const handlerFix = `
async function localstack(event, context) {
    if (event.requestContext) {
        const reqCopy = JSON.parse(JSON.stringify(event.requestContext));
        event.requestContext.http = reqCopy;
        event.requestContext.http.method = event.requestContext.httpMethod;
        const method = event.requestContext.http.method;
        if (method === "GET" || method === "HEAD") {
            delete event.body
        }
    }
    return await lambda(event, context);
}
`;

function insertString(originalString, index, toInsert) {
  return originalString.slice(0, index) + toInsert + originalString.slice(index);
}

async function localstackFix() {
  const packageInfo = JSON.parse(await fs.readFile('package.json'));
  const currentVersion = packageInfo.version;
  const filenamePattern = packageInfo.wsk.name;
  // eslint-disable-next-line no-template-curly-in-string
  const filename = `dist/${filenamePattern.replaceAll('${version}', currentVersion)}.zip`;
  const tempDir = await createTempDir();
  try {
    await extractZipAsync(filename, tempDir);
    const indexJsfilename = path.join(tempDir, 'index.js');
    const indexJs = await fs.readFile(indexJsfilename, 'utf8');
    const indexPattern1 = indexJs.indexOf('e.code === \'ResourceNotFoundException\'');
    const fixedIndexJs1 = insertString(indexJs, indexPattern1, 'e.code === \'UnrecognizedClientException\' || ');
    const indexPattern2 = fixedIndexJs1.indexOf(globalString) + globalString.length;
    const fixedIndexJs2 = insertString(fixedIndexJs1, indexPattern2, handlerFix);
    const indexPattern3 = fixedIndexJs2.indexOf('lambda,', indexPattern2);
    const fixedIndexJs3 = insertString(fixedIndexJs2, indexPattern3, 'localstack,');
    await fs.writeFile(indexJsfilename, fixedIndexJs3);
    await zipDirectoryAsync(tempDir, 'dist/localstack.zip');
  } finally {
    await fs.rm(tempDir, { recursive: true });
  }
}

(async () => {
  await localstackFix();
})();
