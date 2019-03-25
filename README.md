# Vunbox-Backend

A monorepo containing the backend infrastructure services powering: [Vunbox.com](http://vunbox.com)

## Service Definitions

> Each "app" is designed to serve a specific pourpose, we have listed them below.

- `feed` - Arguably the most important app, listens for live socket events from the [Wax.IO](https://wax.io) API.
- `wet` - Grabs case information from the wax api and caches it locally in the db.
- `stats` - While generally named, Listens for changes in events and calculates _user_ stats in realtime.
- `casestats` - Listens for changes in case events and calculates _case_ stats in realtime.
- `casesites` - Listens for changes in case events and calculates _casesite_ stats in realtime.
- `api` - Fetches data from various tables in the database, exposing a simple api.
- `snapshots` - Listens for changes in events and forms "snapshots" of stats each day.
- `leaderboards` - Forms leaderboards for various properties. _WIP_

## Installation & Setup

### Required Dependencies

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
  name=api
  port=9001

  rethink.db=test
  rethink.host=localhost
  rethink.port=
  rethink.user=
  rethink.password=

  # needed only for snapshots app
  gcloud.projectId=
  gcloud.keyFilename="./secrets/gcloud.json"
  gcloud.bucket=
```

### Install Docker

```sh
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
```

### Start Rethinkdb Instance

```bash
  docker pull rethinkdb
  docker run -d -P --name rethink1 rethinkdb
```

### Start Service(s) "apps"

> Below are some simple instructions on how to run an app.

1. Create a `.env` file in the root directory using the template above.
2. Fillout the `.env` template with your relevant details.
3. Start the app name you defined using `yarn start`
   - Alternatively, you can use various defined shorthand methods.
   - `yarn feed`, `yarn stats`, `yarn api`, ... ( see [package.json](/package.json) )
