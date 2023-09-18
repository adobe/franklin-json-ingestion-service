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
