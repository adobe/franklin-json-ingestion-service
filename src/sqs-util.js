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
import { SQS } from '@aws-sdk/client-sqs';
import * as crypto from 'crypto';
import processQueue from '@adobe/helix-shared-process-queue';
import Storage from './storage.js';
import { cloneObject, extractS3ObjectPath, sendSlackMessage } from './utils.js';
import PullingClient from './pulling-client.js';
import InvalidateClient from './invalidate-client.js';
import VariationsUtil from './variations-util.js';

export async function sendMessage(message, groupId) {
  const sqs = new SQS({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL,
  });
  const params = {
    QueueUrl: process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify(message),
    MessageDeduplicationId: crypto.randomUUID(),
    MessageGroupId: groupId,
  };
  await sqs.sendMessage(params);
}

export async function processMessage(context, message) {
  const {
    action, mode, tenant, relPath, variation, silent,
  } = message;

  const storage = new Storage(context);
  const suffix = variation ? `/variations/${variation}` : '';
  const s3ObjectPath = extractS3ObjectPath(message);

  if (action === 'store') {
    // init globalContext for given tenant
    if (!context.cachedSettings[tenant]) {
      try {
        context.cachedSettings[tenant] = await storage.getKey(`${tenant}/settings.json`);
      } catch (e) {
        context.log.error(`Error while fetching settings for tenant ${tenant} due to ${e.message}`);
      }
    }
    const settings = context.cachedSettings[tenant];
    context.log.info(`Pulling content for ${relPath} in ${mode} mode`);
    const data = await new PullingClient(
      context,
      settings[mode].baseURL,
      settings[mode].authorization,
    ).pullContent(relPath, variation);
    if (data) {
      context.log.info('Content pulled successfully storing in S3');
      const storedKey = `${s3ObjectPath}.cfm.gql.json${suffix}`;
      await storage.putKey(
        storedKey,
        data,
        variation,
      );
      context.log.info(`putKey ${storedKey} success`);
      await new InvalidateClient(context).invalidate(`${s3ObjectPath}.cfm.gql.json`, variation);
      if (!variation) {
        const variationMessages = await new VariationsUtil(
          context,
          message,
        ).process(data, message);
        await processQueue(cloneObject(variationMessages), async (variationMessage) => {
          await processMessage(context, variationMessage);
        });
      }
      const varSelector = variation ? `${variation}.` : '';
      const varMessage = variation ? ` for variation ${variation}` : '';
      const url = `${settings[mode].external}/content/dam/${relPath}.cfm.gql.${varSelector}json`;
      if (!silent) {
        await sendSlackMessage(context.cachedSettings[tenant], `Fully hydrated json <${url}|${relPath}> is ready to view in ${mode} mode${varMessage}`);
      }
    } else {
      context.log.info('Content is null due to previous error, skipped');
    }
  } else {
    const evictedKeys = [];
    evictedKeys.push(...await storage.evictKeys(s3ObjectPath));
    await new InvalidateClient(context).invalidateAll(
      evictedKeys,
    );
  }
}
