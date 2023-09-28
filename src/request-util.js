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
import { promisify } from 'util';
import zlib from 'zlib';
import { APPLICATION_JSON } from './constants.js';

const VALID_MODES = ['preview', 'live'];
const VALID_ACTIONS = ['store', 'evict', 'touch', 'cleanup'];
const VALID_METHODS = ['POST'];

const gunzip = promisify(zlib.gunzip);

export default class RequestUtil {
  constructor(request) {
    this.request = request;
    this.isValid = false;
    this.errorMessage = '';
    this.errorStatusCode = 400;
  }

  isAuthorized() {
    const auth = this.request.headers.get('x-edge-authorization') ?? this.request.headers.authorization;
    if (!auth || !auth.startsWith('token ')) {
      // no auth header
      return false;
    }
    // check if the token matches any of the tokens
    const token = auth.substring(6).trim();
    for (let i = 0; i < 4; i += 1) {
      const tokenKey = `EDGE_AUTH_TOKEN_${i}`;
      const configuredTokenValue = process.env[tokenKey];
      if (configuredTokenValue && token === configuredTokenValue) {
        return true;
      }
    }
    // no token matches
    return false;
  }

  async validate() {
    if (!this.isAuthorized()) {
      this.errorMessage = 'Unauthorized';
      this.errorStatusCode = 401;
      return;
    }

    if (!VALID_METHODS.includes(this.request.method)) {
      this.errorMessage = 'Method not allowed';
      this.errorStatusCode = 405;
      return;
    }

    if (!this.request.headers.get('Content-Type').startsWith(APPLICATION_JSON)) {
      this.errorMessage = 'Invalid content type';
      return;
    }

    try {
      if (this.request.headers.get('Content-Encoding') === 'gzip') {
        const buffer = await this.request.buffer();
        const decompressed = await gunzip(buffer);
        this.json = JSON.parse(decompressed.toString());
      } else {
        this.json = await this.request.json();
      }
    } catch (parseError) {
      this.errorMessage = `Error while parsing the body as json due to ${parseError.message}`;
      return;
    }

    this.tenant = this.json.tenant;
    if (!this.tenant || !this.tenant.match(/^[a-zA-Z0-9\-_]*$/g)) {
      this.errorMessage = 'Invalid parameters tenantId value, accept: [a..zA-Z0-9\\-_]';
      return;
    }

    this.relPath = this.json.relPath;
    if (!this.relPath || typeof this.relPath !== 'string' || this.relPath.indexOf('/') === 0) {
      this.errorMessage = 'Invalid parameters relPath value, should not start with /';
      return;
    }
    this.selector = this.json.selector;
    this.mode = this.json.mode || 'preview';

    if (!VALID_MODES.includes(this.mode)) {
      this.errorMessage = `Invalid parameters mode value, accept:${VALID_MODES}`;
      return;
    }

    this.action = this.json.action || 'store';
    if (!VALID_ACTIONS.includes(this.action)) {
      this.errorMessage = `Invalid parameters action value, accept:${VALID_ACTIONS}`;
      return;
    }
    if (this.action === 'cleanup') {
      this.keptVariations = this.json.keptVariations;
      if (!this.keptVariations) {
        this.errorMessage = 'Required keptVariations missing';
        return;
      }
    }
    this.variation = this.json.variation;
    this.payload = this.json.payload;
    this.isValid = true;
  }
}
