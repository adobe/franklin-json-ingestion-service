## [2.1.5](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.1.4...v2.1.5) (2023-11-04)


### Bug Fixes

* **deps:** update external fixes ([50d1c87](https://github.com/adobe/franklin-json-ingestion-service/commit/50d1c87623232029a5490ffdb000ebdab954c534))

## [2.1.4](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.1.3...v2.1.4) (2023-10-30)


### Bug Fixes

* **deps:** update adobe fixes ([15118c5](https://github.com/adobe/franklin-json-ingestion-service/commit/15118c56eadd179b6563d7068a2002bf995c0cf0))

## [2.1.3](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.1.2...v2.1.3) (2023-10-28)


### Bug Fixes

* **deps:** update external fixes ([c7d090c](https://github.com/adobe/franklin-json-ingestion-service/commit/c7d090c1afaaee210dba2e16689264522c5c9d2b))

## [2.1.2](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.1.1...v2.1.2) (2023-10-24)


### Bug Fixes

* SITES-13731 ignore techacct.adobe.com for notifications ([#74](https://github.com/adobe/franklin-json-ingestion-service/issues/74)) ([412b2bd](https://github.com/adobe/franklin-json-ingestion-service/commit/412b2bd0f1fd25e332227438b47ec92a0f631cbe))

## [2.1.1](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.1.0...v2.1.1) (2023-10-21)


### Bug Fixes

* **deps:** update external fixes ([d345368](https://github.com/adobe/franklin-json-ingestion-service/commit/d345368a00f59d5fd153a812734ae39278b8ab27))

# [2.1.0](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.0.5...v2.1.0) (2023-10-20)


### Features

* refactoring to store settings.json in ssm as parameter per tenant ([#63](https://github.com/adobe/franklin-json-ingestion-service/issues/63)) ([bc4a7d5](https://github.com/adobe/franklin-json-ingestion-service/commit/bc4a7d552641d3226612c69b6e68aba1c369e16b))

## [2.0.5](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.0.4...v2.0.5) (2023-10-14)


### Bug Fixes

* **deps:** update external fixes ([bb7b932](https://github.com/adobe/franklin-json-ingestion-service/commit/bb7b93262ebafc22be07cc47f780a2280db1a688))

## [2.0.4](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.0.3...v2.0.4) (2023-10-07)


### Bug Fixes

* **deps:** update external fixes ([b3fed83](https://github.com/adobe/franklin-json-ingestion-service/commit/b3fed8318f905163e13fd75ff73301af8cf3e092))

## [2.0.3](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.0.2...v2.0.3) (2023-09-29)


### Bug Fixes

* **deps:** update external fixes ([7cec41c](https://github.com/adobe/franklin-json-ingestion-service/commit/7cec41cce433bbeb7554dc247a6949c327246928))

## [2.0.2](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.0.1...v2.0.2) (2023-09-29)


### Bug Fixes

* lint ([fae9c24](https://github.com/adobe/franklin-json-ingestion-service/commit/fae9c242fc8aa53fc5136398be04daaedff4f407))
* test for post-deploy ([1234278](https://github.com/adobe/franklin-json-ingestion-service/commit/12342788c7924261d5a42a50be0b77dcd3447805))
* use new AWS account to deploy our lambda ([#57](https://github.com/adobe/franklin-json-ingestion-service/issues/57)) ([a15a0af](https://github.com/adobe/franklin-json-ingestion-service/commit/a15a0af7e5a1e43b0106cb303388f7995558fca9))

## [2.0.1](https://github.com/adobe/franklin-json-ingestion-service/compare/v2.0.0...v2.0.1) (2023-09-18)


### Bug Fixes

* **deps:** update external fixes ([#41](https://github.com/adobe/franklin-json-ingestion-service/issues/41)) ([38fac7d](https://github.com/adobe/franklin-json-ingestion-service/commit/38fac7d14664f14ecc91c4509fe200d493eb9ec0))

# [2.0.0](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.6.1...v2.0.0) (2023-09-18)


* SITES-15403 [Franklin Headless] Implement polling instead of pushing using sqs queue (#55) ([c7e37d8](https://github.com/adobe/franklin-json-ingestion-service/commit/c7e37d8e3f3f0fd6fac8b8c9598ba7df3c40f23e)), closes [#55](https://github.com/adobe/franklin-json-ingestion-service/issues/55)


### BREAKING CHANGES

* use of sqs, polling content from author/publish, send slack notifications

* fix: possible issues is resource is not present

especially on publisher due to content backflow usage)
* use of sqs, polling content from author/publish, send slack notifications

* fix: increase memory and timeout
* use of sqs, polling content from author/publish, send slack notifications

* fix: message group id

* fix: parameter order

* fix: adding more time for post deploy test

* fix: adding increase number of retries

* fix: making it backward compatible with franklin-ingestor 0.0.52

* feat: allow to silence notifications for batch processing

* feat: use initiator information to send slack notifications

* fix: missing await

* feat: allow store in parallel for batch script

* fix: use param.path in message

* feat: support multiple relPath parallel processing per lambda function call

* Revert "feat: support multiple relPath parallel processing per lambda function call"

This reverts commit b0774539088406896013467069386d994fc7e9f9.

* fix: missing to copy initiator for variations slack notification

* fix: test to pass initiator

* fix: remove unused

## [1.6.1](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.6.0...v1.6.1) (2023-06-19)


### Bug Fixes

* adding information how semantic release works ([#48](https://github.com/adobe/franklin-json-ingestion-service/issues/48)) ([516159f](https://github.com/adobe/franklin-json-ingestion-service/commit/516159fa388d72e7aace214c3eafdac7b6bc2bcb))

# [1.6.0](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.5.4...v1.6.0) (2023-05-19)


### Features

* SITES-13393 add new action to perform cleanup of unused variations ([#46](https://github.com/adobe/franklin-json-ingestion-service/issues/46)) ([e9dddad](https://github.com/adobe/franklin-json-ingestion-service/commit/e9dddad0d0c9f8e3dae4959b51948e9e0714b2c7))

## [1.5.4](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.5.3...v1.5.4) (2023-03-05)


### Bug Fixes

* **deps:** update external fixes ([#39](https://github.com/adobe/franklin-json-ingestion-service/issues/39)) ([bac33e7](https://github.com/adobe/franklin-json-ingestion-service/commit/bac33e716e6b89181a8e2a9fb6d970af1d039eb0))

## [1.5.3](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.5.2...v1.5.3) (2023-02-26)


### Bug Fixes

* **deps:** update external fixes ([#36](https://github.com/adobe/franklin-json-ingestion-service/issues/36)) ([d3a6db4](https://github.com/adobe/franklin-json-ingestion-service/commit/d3a6db4b7264c99629f694a4dfc029250bc1f1f9))

## [1.5.2](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.5.1...v1.5.2) (2023-02-20)


### Bug Fixes

* **deps:** update adobe fixes ([9dbee4d](https://github.com/adobe/franklin-json-ingestion-service/commit/9dbee4d1d9ec16eefe1c2840f49ad7aa56eeb16b))

## [1.5.1](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.5.0...v1.5.1) (2023-02-18)


### Bug Fixes

* **deps:** update external fixes ([#31](https://github.com/adobe/franklin-json-ingestion-service/issues/31)) ([c66b476](https://github.com/adobe/franklin-json-ingestion-service/commit/c66b4767577f350e7b41d6ba2d5a8fabfe0844ad))

# [1.5.0](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.4.2...v1.5.0) (2023-02-17)


### Bug Fixes

* **deps:** update adobe fixes ([#19](https://github.com/adobe/franklin-json-ingestion-service/issues/19)) ([00d2e9e](https://github.com/adobe/franklin-json-ingestion-service/commit/00d2e9e10fd10519d5ff3d0775f1ce38e7828da1))
* **deps:** update adobe major ([ee5799e](https://github.com/adobe/franklin-json-ingestion-service/commit/ee5799e468b343ba237a5eea4c9bb3c1df6e1221))
* **deps:** update dependency @aws-sdk/client-s3 to v3.264.0 ([#29](https://github.com/adobe/franklin-json-ingestion-service/issues/29)) ([e5a6bc7](https://github.com/adobe/franklin-json-ingestion-service/commit/e5a6bc72416f4d5bab7481594b894ad39befccbc))
* **deps:** update external fixes ([6c3febe](https://github.com/adobe/franklin-json-ingestion-service/commit/6c3febef8f1d2f3033baed8fc4cc5317850ed166))
* **deps:** update external fixes ([#25](https://github.com/adobe/franklin-json-ingestion-service/issues/25)) ([20a0d64](https://github.com/adobe/franklin-json-ingestion-service/commit/20a0d646d347e3562173813bd1b211f1a0db326e))


### Features

* SITES-9963 adding invalidate cache logic ([#26](https://github.com/adobe/franklin-json-ingestion-service/issues/26)) ([4482d1a](https://github.com/adobe/franklin-json-ingestion-service/commit/4482d1a5c1fe846e47c78609d3e56f47155ab921))

## [1.4.2](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.4.1...v1.4.2) (2022-12-13)


### Bug Fixes

* **deps:** update external fixes ([#15](https://github.com/adobe/franklin-json-ingestion-service/issues/15)) ([3805648](https://github.com/adobe/franklin-json-ingestion-service/commit/3805648ed0bd31b72f67e2828f37ef472915adbe))

## [1.4.1](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.4.0...v1.4.1) (2022-12-05)


### Bug Fixes

* **deps:** update external fixes ([#14](https://github.com/adobe/franklin-json-ingestion-service/issues/14)) ([9a04a79](https://github.com/adobe/franklin-json-ingestion-service/commit/9a04a7978aa3c51b1db34360be856d1e8dad913e))

# [1.4.0](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.3.1...v1.4.0) (2022-12-01)


### Features

* Improve code and implement fully hydrated computation on store|touch action ([#13](https://github.com/adobe/franklin-json-ingestion-service/issues/13)) ([d661671](https://github.com/adobe/franklin-json-ingestion-service/commit/d66167130af7833f3db799cb4cddf8387998bef4))

## [1.3.1](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.3.0...v1.3.1) (2022-11-27)


### Bug Fixes

* **deps:** update external fixes ([#11](https://github.com/adobe/franklin-json-ingestion-service/issues/11)) ([117afdc](https://github.com/adobe/franklin-json-ingestion-service/commit/117afdca551fdeb62b19e00e75e88347175d446d))

# [1.3.0](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.2.0...v1.3.0) (2022-11-24)


### Features

* SITES-9481 Initial implementation ([#10](https://github.com/adobe/franklin-json-ingestion-service/issues/10)) ([3a91661](https://github.com/adobe/franklin-json-ingestion-service/commit/3a916618b73718a2ba92a54c9099ff90e8f30c92))

# [1.2.0](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.1.0...v1.2.0) (2022-11-17)


### Features

* add read json example ([bcd8b80](https://github.com/adobe/franklin-json-ingestion-service/commit/bcd8b80f52a34cb064a3c9762abf1a0ac6b5ab57))

# [1.1.0](https://github.com/adobe/franklin-json-ingestion-service/compare/v1.0.0...v1.1.0) (2022-11-17)


### Features

* change welcome message. ([3a0f59b](https://github.com/adobe/franklin-json-ingestion-service/commit/3a0f59b3a0a96478343fb72841c341335cbb353d))

# 1.0.0 (2022-11-16)


### Bug Fixes

* initial release ([45991ef](https://github.com/adobe/franklin-json-ingestion-service/commit/45991ef0f6544883faf0a2992ffc14267b85fea7))
