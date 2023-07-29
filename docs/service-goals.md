# Service goals

The **Franklin JSON Ingestor Service** goal is to store json representation of structured content (could be CF, but also Excel, Google Doc etc...)

# Source of content

By definition this service ingest some JSON from some provider (in our case AEM author).
In this case it will receive a JSON export from a given Content Fragment or Content Fragment Model eventually.

- **cfm.gql**: an export from Odin AEM author environment json from existing Content Fragment source. **fully hydrated**
  - **example**: /content/dam/ccsurfaces/AppCatalog/en_US/a/b/c.cfm.gql.json 

# Interface / API

The interface for this service is described with the [OpenAPI](swagger.html)
It mainly supports 3 types of action:
- **store**: to store a given JSON in a specific location of the storage.
- **evict**: to remove a given JSON at a specific location of the storage.

In the **store** case it's up to the provider to generate the JSON that will be stored.

# "cfm.gql" / Fully Hydrated JSON format

Legacy format used by Odin, which is the result of a GraphQL query execution, and so have a very specific format signature.

# Additional Note

Along with that process, a side process could index the JSONs and provide new query service.
