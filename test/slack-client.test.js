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

/* eslint-env mocha */
import assert from 'assert';
import nock from 'nock';
import SlackClient from '../src/slack-client.js';

describe('SlackClient Tests', () => {
  beforeEach(() => {
    nock.cleanAll();
    nock.restore();
    nock.activate();
  });
  describe('postMessage', () => {
    it('success', async () => {
      nock('http://slackcloudservice')
        .post('/api/chat.postMessage', (requestBody) => {
          assert.strictEqual(requestBody.channel, 'dummyChannelId');
          assert.strictEqual(requestBody.blocks[0].text.text, 'dummyMessage');
          return true;
        })
        .reply(200, { ok: true });
      await new SlackClient('http://slackcloudservice', 'dummyToken')
        .postMessage('dummyChannelId', 'dummyMessage');
    });
    it('fail on 500', async () => {
      nock('http://slackcloudservice')
        .post('/api/chat.postMessage')
        .reply(500, 'issue trying to postmessage');
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .postMessage('dummyChannelId', 'dummyMessage');
      }, {
        message: /Error while doing call to post message: dummyChannelId due to .*/,
        name: 'Error',
      });
    });
    it('fail on not ok', async () => {
      nock('http://slackcloudservice')
        .post('/api/chat.postMessage')
        .reply(200, {
          ok: false,
          error: 'issue trying to post message',
        });
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .postMessage('dummyChannelId', 'dummyMessage');
      }, {
        message: /Error while doing call to post message: dummyChannelId due to issue trying to post message/,
        name: 'Error',
      });
    });
  });
  describe('findUserId', () => {
    it('success', async () => {
      nock('http://slackcloudservice')
        .get('/api/users.lookupByEmail?email=a@b')
        .reply(200, { ok: true, user: { id: 'dummyId' } });
      await new SlackClient('http://slackcloudservice', 'dummyToken')
        .findUserId('a@b');
    });
    it('fail on 500', async () => {
      nock('http://slackcloudservice')
        .get('/api/users.lookupByEmail?email=a@b')
        .reply(500, 'issue trying to postmessage');
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .findUserId('a@b');
      }, {
        message: /Error while doing call to findUserId with: a@b due to .*/,
        name: 'Error',
      });
    });
    it('fail on not ok', async () => {
      nock('http://slackcloudservice')
        .get('/api/users.lookupByEmail?email=a@b')
        .reply(200, {
          ok: false,
          error: 'unknown user',
        });
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .findUserId('a@b');
      }, {
        message: /Error while doing call to findUserId with: a@b due to unknown user/,
        name: 'Error',
      });
    });
  });
  describe('createConversation', () => {
    it('success', async () => {
      nock('http://slackcloudservice')
        .post('/api/conversations.open')
        .reply(200, { ok: true, channel: { id: 'dummyChannelId' } });
      await new SlackClient('http://slackcloudservice', 'dummyToken')
        .createConversation('dummyUserId');
    });
    it('fail on 500', async () => {
      nock('http://slackcloudservice')
        .post('/api/conversations.open')
        .reply(500, 'issue trying to postmessage');
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .createConversation('dummyUserId');
      }, {
        message: /Error while doing call to create conversation with: dummyUserId due to .*/,
        name: 'Error',
      });
    });
    it('fail on not ok', async () => {
      nock('http://slackcloudservice')
        .post('/api/conversations.open')
        .reply(200, {
          ok: false,
          error: 'unknown userId',
        });
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .createConversation('dummyUserId');
      }, {
        message: /Error while doing call to create conversation with: dummyUserId due to unknown userId/,
        name: 'Error',
      });
    });
  });
});
