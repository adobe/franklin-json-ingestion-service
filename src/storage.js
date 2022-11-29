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
  CopyObjectCommand, GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import processQueue from '@adobe/helix-shared-process-queue';
import { cloneObject } from './utils.js';
import { DEFAULT_BUCKET } from './constants.js';

export default class Storage {
  constructor(context) {
    this.context = context || { log: console };
    const s3Config = {
      endpoint: process.env.AWS_ENDPOINT_URL || undefined,
    };
    this.s3 = new S3Client(s3Config);
    this.bucket = process.env.AWS_BUCKET || DEFAULT_BUCKET;
    this.context.log.info(`Using Bucket=${this.bucket}`);
    this.context.log.info(`Using s3Config=${JSON.stringify(s3Config)}`);
  }

  buildDefaultParams(options = {}) {
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
      Body: JSON.stringify(payload),
      Key: key,
      ContentType: 'application/json',
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

  async getKey(key) {
    const params = this.buildDefaultParams({
      Key: key,
    });

    try {
      const data = await this.s3.send(new GetObjectCommand(params));
      return JSON.parse(data.Body.toString('utf-8'));
    } catch (err) {
      throw new Error(
        `An error occurred while trying to read ${key} in S3 bucket due to ${err.message} after several attempts`,
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
        `An error occurred while trying to copy ${sourceKey} to ${targetKey} in S3 bucket due to ${err.message}`,
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
      const listObject = await this.listKeys(`${prefix}/`);
      const deletedKeys = [{ Key: prefix }];
      listObject.forEach((o) => deletedKeys.push({ Key: o.Key }));
      await processQueue(cloneObject(deletedKeys), async (key) => this.evictKey(key));
      this.context.log.info('evictKeys successful');
      return deletedKeys;
    } catch (err) {
      this.context.log.error(`evictKeys failed ${err.message}`);
      throw new Error(`An error occurred while trying to evict key(s) in S3 bucket due to ${err.message}`);
    }
  }

  async evictKey(key) {
    try {
      await this.s3.send(new DeleteObjectCommand(this.buildDefaultParams({
        Key: key,
      })));
      this.context.log.info('evictKey successful');
      return key;
    } catch (err) {
      this.context.log.error(`evictKey failed ${err.message}`);
      throw new Error(`An error occurred while trying to evict key in S3 bucket due to ${err.message}`);
    }
  }
}
