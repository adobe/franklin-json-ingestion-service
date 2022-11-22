/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {
  CopyObjectCommand,
  DeleteObjectCommand, DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import zlib from 'zlib';

// Helper Promise function to wrap node zlib.gzip(..)
function gzipify(str) {
  return new Promise((resolve, reject) => {
    zlib.gzip(str, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
}

export default class Storage {
  constructor() {
    this.s3 = new S3Client();
    this.bucket = 'franklin-content-bus-headless';
  }

  buildDefaultParams(options) {
    return {
      Bucket: this.bucket,
      ...options,
    };
  }

  async deleteKey(key) {
    const params = this.buildDefaultParams({
      Key: key,
    });
    await this.s3.send(new DeleteObjectCommand(params));
    return key;
  }

  async putKey(key, payload, variation) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid parameters payload value, accept:{...} object');
    }

    const params = this.buildDefaultParams({
      Body: await gzipify(JSON.stringify(payload)),
      Key: key,
      ContentType: 'application/json',
      ContentEncoding: 'gzip',
      Metadata: {
        variation,
      },
    });

    try {
      await this.s3.send(new PutObjectCommand(params));
      return key;
    } catch (err) {
      throw new Error(
        `An error occurred while trying to store ${key} in S3 bucket due to ${err.message}`,
      );
    }
  }

  async copyKey(sourceKey, targetKey) {
    const params = this.buildDefaultParams({
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: targetKey,
    });
    try {
      await this.s3.send(new CopyObjectCommand(params));
      return targetKey;
    } catch (err) {
      throw new Error(
        `An error occurred while trying to copy ${sourceKey}  to ${targetKey} in S3 bucket due to ${err.message}`,
      );
    }
  }

  async listKeys(prefix) {
    let ContinuationToken;
    const objects = [];
    do {
      // eslint-disable-next-line no-await-in-loop
      const result = await this.s3.send(new ListObjectsV2Command(this.buildDefaultParams({
        ContinuationToken,
        Prefix: prefix,
      })));
      ContinuationToken = result.IsTruncated ? result.NextContinuationToken : '';
      (result.Contents || []).forEach((content) => {
        objects.push(content);
      });
    } while (ContinuationToken);
    return objects;
  }

  async evictKeys(prefix) {
    try {
      const listObject = await this.listKeys(`${prefix}.`);
      await this.s3.send(new DeleteObjectsCommand(this.buildDefaultParams({
        Delete: {
          Objects: listObject,
        },
      })));
      return listObject;
    } catch (err) {
      throw new Error(`An error occurred while trying to delete a key in S3 bucket due to ${err}`);
    }
  }
}
