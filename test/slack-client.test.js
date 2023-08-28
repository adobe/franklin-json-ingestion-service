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
  describe('createConversation', () => {
    it('success', async () => {
      nock('http://slackcloudservice', {
        reqheaders: {
          authorization: 'Bearer dummyToken',
        },
      })
        .post('/api/conversations.open', (requestBody) => {
          assert.strictEqual(requestBody.users, 'dummyUserId');
          return true;
        })
        .reply(200, {
          ok: true,
          channel: {
            id: 'dummyChannelId',
          },
        });
      const result = await new SlackClient('http://slackcloudservice', 'dummyToken')
        .createConversation('dummyUserId');
      assert.strictEqual(result, 'dummyChannelId');
    });
    it('fails FetchError', async () => {
      nock('http://slackcloudservice')
        .post('/api/conversations.open')
        .replyWithError('connection error');
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .createConversation('dummyUserId');
      }, {
        message: 'connection error',
        name: 'FetchError',
      });
    });
    it('fails 500 error', async () => {
      nock('http://slackcloudservice')
        .post('/api/conversations.open')
        .reply(500, {});
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .createConversation('dummyUserId');
      }, {
        message: /Error while doing call to create conversation: dummyUserId due to /,
        name: 'Error',
      });
    });
    it('fails not ok', async () => {
      nock('http://slackcloudservice')
        .post('/api/conversations.open')
        .reply(200, {
          ok: false,
          error: 'dummyError',
        });
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .createConversation('dummyUserId');
      }, {
        message: /Error while doing call to create conversation: dummyUserId due to dummyError/,
        name: 'Error',
      });
    });
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
    /* it('success on slack.com', async () => {
      await new SlackClient('https://slack.com', 'xoxb-6470950466-4707359141873-YdwEHkURptQEWX5L2soLFET0')
        .postMessage('C05PHRCNLH1', 'Hello');
    }); */
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
  describe('joinChannel', () => {
    it('success', async () => {
      nock('http://slackcloudservice')
        .post('/api/conversations.join', (requestBody) => {
          assert.strictEqual(requestBody.channel, 'dummyChannelId');
          return true;
        })
        .reply(200, {
          ok: true,
        });
      await new SlackClient('http://slackcloudservice', 'dummyToken')
        .joinChannel('dummyChannelId');
    });
    it('fail on 500', async () => {
      nock('http://slackcloudservice')
        .post('/api/conversations.join')
        .reply(500, 'issue trying to join');
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .joinChannel('dummyChannelId');
      }, {
        message: /Error while doing call to join: dummyChannelId due to .*/,
        name: 'Error',
      });
    });
    it('fail on not ok', async () => {
      nock('http://slackcloudservice')
        .post('/api/conversations.join')
        .reply(200, {
          ok: false,
          error: 'issue trying to join non private channel',
        });
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .joinChannel('dummyChannelId');
      }, {
        message: /Error while doing call to join: dummyChannelId due to issue trying to join non private channel/,
        name: 'Error',
      });
    });
  });
  describe('findUserIdByEmail', () => {
    it('success', async () => {
      nock('http://slackcloudservice')
        .get('/api/users.lookupByEmail?email=testuser@dummy.com')
        .reply(200, {
          ok: true,
          user: {
            id: 'dummyUserId',
          },
        });
      const userId = await new SlackClient('http://slackcloudservice', 'dummyToken')
        .findUserIdByEmail('testuser@dummy.com');
      assert.strictEqual(userId, 'dummyUserId');
    });
    it('fail on 500', async () => {
      nock('http://slackcloudservice')
        .get('/api/users.lookupByEmail?email=testuser@dummy.com')
        .reply(500, 'server issue');
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .findUserIdByEmail('testuser@dummy.com');
      }, {
        message: /Error while doing call to find user id by email: testuser@dummy.com due to .*/,
        name: 'Error',
      });
    });
    it('fail on not ok', async () => {
      nock('http://slackcloudservice')
        .get('/api/users.lookupByEmail?email=testuser@dummy.com')
        .reply(200, {
          ok: false,
          error: 'user not found',
        });
      await assert.rejects(async () => {
        await new SlackClient('http://slackcloudservice', 'dummyToken')
          .findUserIdByEmail('testuser@dummy.com');
      }, {
        message: /Error while doing call to find user id by email: testuser@dummy.com due to .*/,
        name: 'Error',
      });
    });
  });
});
