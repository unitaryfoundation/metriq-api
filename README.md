# Welcome to metriq!

There are 3 main components to this project:

1. `metriq-postgres`: The PostgreSQL database for users/benchmarks/service state/etc.
2. `metriq-app`: The web app the client uses to interact with `metriq-api`
3. `metriq-api`: A REST API that serves as the glue between database and client.

**Make sure to initialize the submodules with `git submodule init` and `git submodule update`.**

## Setting up a development environment (on Ubuntu)

First, clone the repositories and initialize the submodules:

```sh
 $ git clone https://github.com/unitaryfoundation/metriq-api.git
 $ cd metriq-api
 $ git submodule init
 $ git submodule update
```
 
Install PostgreSQL and Node.js. (The Ubuntu system packages are fine, or you can install directly from the maintainers' sites.)

```sh
 $ sudo apt install postgresql postgresql-contrib nodejs npm
```

Restore the QA database in `metriq-postgres` as your Metriq development environment interface. (From the `metriq-api` repository folder, `cd` into `metriq-postgres`.)

```sh
     user$ cd metriq-postgress
     user$ sudo cp data/metriq_qa.sql /var/lib/postgresql
     user$ sudo -i -u postgres
 postgres$ psql
```

In `psql`, enter the following SQL commands, to create the Metriq database and user. (Pick a strong, private password, instead of 'ExamplePassword'):
```sql
CREATE USER metriq WITH PASSWORD 'ExamplePassword';
CREATE DATABASE metriq WITH OWNER metriq;
quit
```

You'll need to export this password as an environment variable, so that `metriq-api` can access the PostgreSQL database. See the configuration files in the code, but you can create a shell script `metriq_env_vars.sh` that runs `export` on configuration settings, then add it your shell startup with the line
```sh
. ~/metriq_env_vars.sh
```
in your (hidden) `.bashrc` profile file.

After quiting `psql`, you can restore the backup:
```sh
 postgres$ psql -d metriq -a -f metriq_qa.sql
```

That's it! You likely also want to install an integrated development environment, like Visual Studio Code, to edit and run the software. Open the top-level `metriq-api` repository folder, and start there.

To start the local testing environment, for example, after opening the top-level `metriq-api` folder in VS Code, open two terminals. Run these commands in the `metriq-api` sub-folder:
```sh
 $ npm i
 $ sudo npm i -g nodemon
 $ nodemon start index.js
```
`nodemon start` is the command that actually runs the RESTful API server.

In the other terminal, run the following commands in the `metriq-app` sub-folder:
```sh
 $ npm i
 $ npm start
```
`npm start` is the command that actually runs the front-end testing server. You might need to alter `config.js`, depending on your environment, to see the proper behavior from the front-end app.
