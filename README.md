⚠️ **Repository archived**

This repository is no longer actively maintained.

Please refer to the new Metriq umbrella repository for the latest code and updates:

👉 https://github.com/unitaryfoundation/metriq


-------------------

<div align="center">
  <img src="./metriq-app/src/images/metriq_logo_primary_blue_inverted.png" alt="Metriq logo" width="450" />
</div>

# metriq-web

[![Unitary Foundation](https://img.shields.io/badge/Supported%20By-Unitary%20Foundation-FFFF00.svg)](https://unitary.foundation)

**metriq-web** is the open-source web application and API powering the [Metriq](https://metriq.info) platform.

Metriq is a community-driven platform for hosting quantum benchmarks.  
Its main focus is to help answer:

> _How does quantum computing platform X running software stack Y perform on workload Z? And how has that changed over time?_

Metriq is free to sign up and submit results, whether you are a researcher publishing your own results, or a reader who wants to add data. Both are much appreciated!

## 🚩 Disclaimers

- This repository is tightly coupled to the infrastructure of the production [metriq.info](https://metriq.info) instance and is not currently designed for public deployment.  
  If you are interested in deploying your own instance and need assistance, please [open an issue](https://github.com/unitaryfoundation/metriq-web/issues) or contact us at [metriq@unitary.foundation](mailto:metriq@unitary.foundation).
- As of September 2025, the codebase is being actively refactored and improved. There may be breaking changes to the API and/or web app.  
  If you plan to open a pull request, it is particularly important to open an issue first to discuss your plans.

## 🗂️ Overview

This project consists of three main components:

1. **[`/metriq-app`](./metriq-app/)**: A React JS web application providing the user interface and interactive visualizations for Metriq.
2. **[`/metriq-api`](./metriq-api/)**: A Node.js REST API backend, handling data access and business logic.
3. **PostgreSQL database**: Stores all benchmark data. Utilities for managing the database can be found in the [unitaryfoundation/metriq-postgres](https://github.com/unitaryfoundation/metriq-postgres) repository.

Together, these components power the Metriq platform, enabling users to submit, explore, and analyze quantum computing benchmarks in a collaborative and transparent environment.

## 🛠️ Developer Setup

### Prerequisites

- **PostgreSQL**: Stores all benchmark data.
- **Node.js**: Required for both the backend API and frontend app.
- **Nodemon** (recommended): Automatically restarts the server on file changes.

### Database Setup

1. **Install PostgreSQL** and ensure it is running.
2. **Create a database user and database** for Metriq.  
   From the `psql` prompt:

   ```sql
   CREATE USER metriq WITH PASSWORD 'ExamplePassword';
   CREATE DATABASE metriq WITH OWNER metriq;
   \q
   ```

3. **Restore the database schema and sample data**  
   A sample backup file (with fake or obfuscated user data), `metriq_qa.sql`, is provided in the [unitaryfoundation/metriq-postgres repository](https://github.com/unitaryfoundation/metriq-postgres/blob/main/data/metriq_qa.sql).  
   Restore it with:

   ```sh
   psql -d metriq -a -f metriq_qa.sql
   ```

### Running the Application

You need to run both the backend API and the frontend app in separate terminals.

#### **Backend (`./metriq-api`):**

```sh
cd metriq-api
npm install
npm install -g nodemon   # if not already installed
nodemon start index.js
```

This starts the backend API server (development mode).

#### **Frontend (`./metriq-app`):**

```sh
cd metriq-app
npm install
npm start
```

This starts the frontend React app (development mode).

You should now be able to access:

- The web app at [http://localhost:3000](http://localhost:3000)
- The API at [http://localhost:8080](http://localhost:8080) (default ports)

> _Note: We plan to add Docker support in the future for easier setup, see [this issue](https://github.com/unitaryfoundation/metriq-web/issues/236)_.

### ⚙️ Configuration

Configuration details for both the API and app can be found in their respective `config.js` files.  
You may need to adjust these files to match your local environment (e.g., database credentials, API endpoints).

---

## 🤝 Contributing

We welcome contributions from the community!  
If you have ideas or want to contribute, please [open an issue](https://github.com/unitaryfoundation/metriq-web/issues) to discuss your plans before submitting a pull request.

## 📫 Contact

For questions, suggestions, or deployment inquiries, please contact us at [metriq@unitary.foundation](mailto:metriq@unitary.foundation).
