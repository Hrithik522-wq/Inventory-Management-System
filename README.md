# Inventory-Management-System (Web)

This repo contains a full-stack web version of the Inventory Management System:
- **Frontend:** React + Vite (under `web/`)
- **Backend:** PHP JSON API + MySQL (under `server/`)

The legacy JavaFX code was moved into `legacy-java/`.

## Default login
- Regular user: `HR@gmail` / `qwerty`
- Admin login: `admin123` / `admin@123`

## Requirements
- MySQL server
- PHP (for the built-in web server)
- Node.js + npm (for the React/Vite frontend)

## Configure MySQL
Update `server/config.php` or set env vars:
- `DB_HOST` (default `127.0.0.1`)
- `DB_PORT` (default `3306`)
- `DB_NAME` (default `inventory_db`)
- `DB_USER` (default `root`)
- `DB_PASSWORD` (default `12345678`)

## Start the backend (PHP)
From the repo root:
```sh
php -S localhost:8000 -t server index.php
```
On first start, the backend auto-creates the schema using `database_setup.sql` and inserts the default HR user.

## Start the frontend (React/Vite)
```sh
cd web
npm install
npm run dev
```

Vite is configured to proxy `/api` requests to `http://localhost:8000`.
