# Storage Structure

In order to support the different use cases the following folder structured could help

## Definitions

- **tenant**: Equivalent of AEM /content/dam/tenant folder
- **live**: State in which the content is used as the origin for the final consumer.
- **preview**: State in which the content is used for the author to experience how the content would appear as in live.
- **variation**: Allow to store an alternative "version" of the json for the same resource.

# Example

Following is an example how it could look like when content is stored in the S3 bucket.

```
- tenant1
  settings.json (used to store tenant specific settings, e.g. slack, aem urls etc..)
  -live
    -folder1
      -fruits
        apple.cfm.gql.json
        apple.cfm.gql.json/variations/var1
        apple.cfm.gql.json/variations/var1/fully
      cf2.cfm.gql.json
    -folder2
    ...
    -folderN
  -preview
    -folder1
      -fruits
        apple.cfm.gql.json
        apple.cfm.gql.json/variations/var1
        apple.cfm.gql.json/variations/var1/fully
      ...
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
