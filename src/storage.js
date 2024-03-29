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
  ListObjectsV2Command, GetObjectCommand,
  PutObjectCommand,
  S3Client, DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { cloneObject } from './utils.js';
import { DEFAULT_BUCKET } from './constants.js';

export default class Storage {
  constructor(context) {
    this.context = context || { log: console };
    const s3Config = {
      endpoint: process.env.AWS_ENDPOINT_URL,
    };
    if (s3Config.endpoint && s3Config.endpoint.indexOf('//localhost:') > 0) {
      s3Config.forcePathStyle = true;
    }
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

  async putKey(key, payload, variation) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid parameters payload value, accept:{...} object');
    }

    const params = this.buildDefaultParams({
      Body: JSON.stringify(payload),
      Key: key,
      ContentType: 'application/json;charset=utf-8',
    });

    if (variation) {
      params.Metadata = {
        variation,
      };
    }

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
      const jsonString = await data.Body.transformToString('utf-8');
      return JSON.parse(jsonString);
    } catch (err) {
      throw new Error(
        `An error occurred while trying to read ${key} in S3 bucket due to ${err.message} after several attempts`,
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

  async evictKeys(key) {
    try {
      const keyWithSuffix = `${key}.cfm.gql.json`;
      const list1 = await this.listKeys(`${key}/`);
      const list2 = await this.listKeys(`${keyWithSuffix}/`);
      const deletedKeys = [
        { Key: keyWithSuffix },
        ...list1,
        ...list2,
      ];
      return await this.deleteKeys(deletedKeys);
    } catch (err) {
      this.context.log.error(`evictKeys failed ${err.message}`);
      throw new Error(`An error occurred while trying to evict key(s) in S3 bucket due to ${err.message}`);
    }
  }

  async deleteKeys(keys) {
    try {
      if (keys && keys.length > 0) {
        await this.s3.send(new DeleteObjectsCommand(this.buildDefaultParams({
          Delete: {
            Objects: cloneObject(keys),
          },
        })));
      }
      this.context.log.info(`deleteKeys ${keys.map((i) => i.Key).join(',')} successful`);
      return keys;
    } catch (err) {
      this.context.log.error(`deleteKeys failed ${err.message}`);
      throw new Error(`deleteKeys failed ${err.message}`);
    }
  }
}
