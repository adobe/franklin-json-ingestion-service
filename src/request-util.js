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
import { SERVICE_ENDPOINT_NAME, FULLY_HYDRATED_SUFFIX } from './constants.js';

const EXT_JSON = '.json';

export default class RequestUtil {
  constructor(request) {
    const indexFullyHydrated = request.url.indexOf(FULLY_HYDRATED_SUFFIX);
    const isJson = request.url.endsWith(EXT_JSON);
    if (isJson && indexFullyHydrated > 0) {
      const path = request.url.substring(0, indexFullyHydrated);
      this.key = path.substring(
        path.indexOf(SERVICE_ENDPOINT_NAME) + SERVICE_ENDPOINT_NAME.length + 1,
      );
      const suffix = request.url.substring(
        request.url.indexOf(FULLY_HYDRATED_SUFFIX) + FULLY_HYDRATED_SUFFIX.length,
      );
      if (suffix !== EXT_JSON) {
        this.variation = suffix.substring(1, suffix.length - EXT_JSON.length);
      }
    }
  }

  getKey() {
    return this.key;
  }

  getVariation() {
    return this.variation;
  }
}
