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
import { fetch } from '@adobe/fetch';

function buildMessageBody(channelId, message) {
  return {
    channel: channelId,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ],
  };
}

export default class SlackClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.authorization = `Bearer ${token}`;
  }

  async postMessage(channelId, message) {
    const url = `${this.baseURL}/api/chat.postMessage`;
    const headers = this.buildDefaultHeaders();
    const body = buildMessageBody(channelId, message);
    const response = await fetch(url, { method: 'POST', headers, body });
    if (response.status === 200) {
      const data = await response.json();
      if (!data.ok) {
        throw new Error(`Error while doing call to post message: ${channelId} due to ${data.error}`);
      }
    } else {
      throw new Error(`Error while doing call to post message: ${channelId} due to ${response.statusText}`);
    }
  }

  buildDefaultHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: this.authorization,
    };
  }
}
