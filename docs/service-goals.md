# Service goals

The **Franklin JSON Ingestor Service** goal is to store json representation of structured content (could be CF, but also Excel, Google Doc etc...)

# Source of content

By definition this service ingest some JSON from some provider (in our case AEM author).
In this case it will receive an JSON export from a given Content Fragment or Content Fragment Model eventually.

- **cfm.gql**: an export from Odin AEM author environment json from existing Content Fragment source. **fully hydrated**
  - **example**: /content/dam/ccsurfaces/AppCatalog/en_US/a/b/c.cfm.gql.json 
- **franklin**: A new type of export from AEM author environment json representing a Content Fragment source. **NOT fully hydrated**
  - **example**: /content/dam/ccsurfaces/AppCatalog/en_US/a/b/c.franklin.json

# Interface / API

The interface for this service is described with the [OpenAPI](swagger.html)
It mainly support 3 type of actions:
- **store**: to store a given JSON in a specific location of the storage.
- **evict**: to remove a given JSON at a specific location of the storage.
- **touch**: to tell the service to re-compute the fully hydrated JSON and store it (specific to "franklin" source).

In the **store** case it's up to the provider to generate the JSON that will be stored.

# "cfm.gql" JSON format

Legacy format used by Odin, which is the result of a GraphQL query execution, and so have a very specific format signature.

# "franklin" JSONs formats

The "franklin" JSON format suppose that 2 types of JSONs are exported
- **json schema**: a json schema type which would help to understand and validate other json representing structured content.
- **json**: a json used to store structured content (in our case Content Fragment).

## Export a CF Model as json schema file.

One could read the CF model definition and simply expose the different field type into json schema property type.
The important is to make it so that it can be easily included in a global json schema definition later or as GraphQL schema.

## Export a CF as json file.

The exported CF as json should then also match the json schema of its exported model.
It should include additional properties like "_path", "_model", "_variation" etc.. that could help to easily identify it.
It should allow to easily represent references to other CF relative the <tenant>/<preview> [storage structure](storage-structure.md).

# Fully hydrated JSON generation

One of the issue that could be solved when storing the CF as json directly is the fully hydrated json.
It can be computed each time a **store** or **touch** action is called at a given location in the storage structure.
The computation is mainly about resolving the references by loading the fully hydrated json of that reference, and replacing it by the loaded json.

# Additional Note

Along with that process, a side process could index the JSONs and provide new query service.