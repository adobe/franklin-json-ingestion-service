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
import {fetch} from "@adobe/fetch";

export default class InvalidateClient {
    constructor(context, baseURL) {
        this.context = context || { log: console };
        this.baseURL = baseURL || "https://api.experiencecloud.live/publish-event/franklin-content-bus-headless";
    }

    async invalidate(key) {
        try {
            const method = 'POST';
            const body = {
                "event": {
                    "type":"s3",
                    "file": `/${key}`
                }
            };
            await fetch(this.baseURL, { method, body });
            this.context.log.info(`invalidated ${key} success`);
            return true;
        } catch (err) {
            this.context.log.error(`invalidate failed due to ${err.message}`);
        }
        return false;
    }
}