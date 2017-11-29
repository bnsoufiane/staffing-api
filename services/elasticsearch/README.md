### Elasticsearch service layer

This service should be injected to the resources that are being managed on elastic.
```
const esCompany =
  require('../../services/elasticsearch')({
    type: constants.ELASTIC_TYPES.COMPANY
  });
```

Each elasticsearch service instance is pointed to a specific `type` in elasticsearch. Consider `type` as a collection.

1. To **index** (insert) a document you can call `.insert(...)` method. Like so,
```
esCompany.insert(doc)
.then(...)
.catch(...);
```
2. To do a **bulk index** (bulk insert), you can do `.bulkInsert(...)`, like so,
```
esCompany.bulkInsert(arrayOfDocuments)
.then(...)
.catch(...);
```
3. To perform a search on a elastic type you can call `.search(...)`, like so,
```
esCompany.search(params, getAggs)
.then(...)
.catch(...)
// here 'params' is a key/value pair for the fields you want to query against, details for this are given below.
// 'getAggs' is a flag to let you decide whether or not you want aggregations in reponse. 

```
#### Search _params_
`params` object in the search api is a key/value pair, where the *key* can be the exact name of field in elastic type. Or it can be any string that maps on an existing field in an elastic type. These mappings can be found in `./defaults.js` against the key `TYPE`. Each type has a property named `queryOn`, this represents the elastic fields that can be queried against using the elasticsearch service. For example in `TYPES.company` you'll see `markets: 'categories'`, this means that the client can pass a value against key `market` and as a result `categories` field in elastic will be queried for the given value.

##### Operators in _params_
Lets consider the following example,
```
//the params looks like this
params = {
  'markets': ['Android', 'Apps'],
  'funding>': 50000,
  'size<': 1000,
  'revenue~': [10000, 100000]
};
```
Currently, 4 operators are supported, 'greater than' `>`, 'lesser than' `<`, and 'range' `~`. The above query can translated to following,

*companies from market `Android` or `Apps`, with `funding` greater than 50000, of `size` lesser than 1000 and `revenue` between 10000 and 100000*.
