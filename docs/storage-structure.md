# Storage Structure

In order to support the different use cases the following folder structured could help

## Definitions

- **tenant**: Equivalent of AEM /content/dam/tenant folder
- **live**: State in which the content is used as the origin for the final consumer.
- **preview**: State in which the content is used for the author to experience how the content would appear as in live.
- **_models_**: Special folder in which all the models definition as json schema could be stored (for franklin selector only).
- **selector**: Part of the filename using to differentiate the source of the exported json (i.e cfm.gql or franklin).
- **variation**: Allow to store an alternative "version" of the json for the same resource.
- **fully**: A special rendition of the json which resolve the references (for franklin selector only).

# Example

Following is an example how it could look like when content is stored in the S3 bucket.

```
- tenant1
  -live
    -_models_
      model1.franklin.json
      model2.franklin.json
    -folder1
      -fruits
        apple.franklin.json
        apple.franklin.json/fully
        apple.franklin.json/variations/var1
        apple.franklin.json/variations/var1/fully
      ...
      cf.franklin.json
      cf.franklin.json/fully
      cf2.cfm.gql.json
    -folder2
    ...
    -folderN
  -preview
    -_models_
      model1.franklin.json
      model2.franklin.json
      model3.franklin.json
    -folder1
      -fruits
        apple.franklin.json
        apple.franklin.json/fully
        apple.franklin.json/variations/var1
        apple.franklin.json/variations/var1/fully
        orange.franklin.json
        orange.franklin.json/variations/var1
        orange.franklin.json/variations/var1/fully
      ...
      cf.franklin.json
      cf.franklin.json/fully
      cf2.cfm.gql.json
    -folder2
    ...
    -folderN
...
- tenantN
  -live
    -folder1
    -folder2
    ...
    -folderN
  -preview
    -folder1
    -folder2
    ...
    -folderN
```