# Vunbox-Backend

Backend code and infrastructure providing the services powering [Vunbox.com](http://vunbox.com)

## Setup

> This project is built and maintained using Node.js, RethinkDB & Yarn.

- [RethinkDB v2.3.6](https://www.rethinkdb.com/docs/install/)
- [NodeJS v11.0](https://nodejs.org/en/download/current/)
- [YarnPkg](https://yarnpkg.com/lang/en/docs/install)

### Enviornment Variables

> Required enviornment variables used by the various apps.

- `name` - name of the app you want to run
- `port` - port to expose the app/api
- `rethink.db` - database name for rethinkdb
- `rethink.host` - host url/ip for rethinkdb
- `rethink.port` - port for rethinkdb
- `rethink.user` - username for rethinkdb
- `rethink.password` - password for rethinkdb
- `gcloud.projectId` - project id associated to the bucket
- `gcloud.keyFilename` - gcloud bucket credentials
- `gcloud.bucket` - gcloud bucket name

```env
# Example ENV

name=api
port=9001

rethink.db=test
rethink.host=localhost
rethink.port=
rethink.user=
rethink.password=

gcloud.projectId=
gcloud.keyFilename="./secrets/gcloud.json"
gcloud.bucket=
```

## Startup

> Below are some simple instructions on how to run an app.

1. Create a `.env` file in the root directory using the template above.
2. Fillout the `.env` template with your relevant details.
3. Start the app name you defined using `yarn start`
   - Alternatively, you can use various defined shorthand methods.
   - `yarn feed`, `yarn stats`, `yarn api`, ... ( see [package.json](/package.json) )
