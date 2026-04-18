# StockXpert 🚀
### Modern Inventory Management with AI-Driven Analytics

StockXpert is a robust, full-stack inventory management system designed to empower businesses with real-time tracking, intelligent stock predictions, and a high-performance administration dashboard. Successfully migrated from a legacy JavaFX architecture to a modern web platform.

---

## ✨ Key Features

### 📦 Smart Inventory Management
*   **Complete Lifecycle Tracking**: full CRUD operations for products, categories, and suppliers.
*   **Purchase Records**: Seamlessly track incoming stock and historical transaction data.
*   **Status Indicators**: Visual color-coded alerts for **GOOD**, **LOW**, and **CRITICAL** stock levels.

### 🧠 AI-Driven Insights
*   **Predictive Analytics**: Uses moving average algorithms on historical data to estimate monthly demand trends.
*   **Auto-Reorder Suggestions**: Automatically calculates suggested quantities needed for restocking before exhaustion.

### 📊 Professional Dashboards
*   **Interactive Visualizations**: Real-time charts powered by **Chart.js**.
*   **Trend Tracking**: Analyze most/least purchased items and category distribution.
*   **Transaction Timelines**: Monthly purchase history at a glance.

### 🔒 Enterprise Oversight
*   **Multi-Tier Authentication**: Dedicated portals for regular users and administrative staff.
*   **Global Monitoring**: Admin dashboard for system-wide health checks and customer inquiry management.
*   **Email Alerts**: Automated SMTP notifications for low-stock events.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Vite, Chart.js, Custom CSS (Aesthetics focused) |
| **Backend** | PHP (RESTful JSON API) |
| **Database** | MySQL |
| **Architecture** | Decoupled Client-Server (REST) |

---

## 🚀 Getting Started

### Prerequisites
*   **PHP** (Built-in server or Apache/Nginx)
*   **MySQL Server**
*   **Node.js & npm** (For React development)

### 1. Database Setup
1.  Run the `database_setup.sql` script on your MySQL server to create the schema.
2.  Configure your database credentials in `server/config.php`.

### 2. Backend Configuration
1.  Navigate to the `server/` directory.
2.  Update `mail_config.php` with your SMTP details to enable email alerts.
3.  Start the PHP server:
    ```sh
    php -S localhost:8000 -t server index.php
    ```

### 3. Frontend Setup
1.  Navigate to the `web/` directory.
2.  Install dependencies:
    ```sh
    npm install
    ```
3.  Start the development server:
    ```sh
    npm run dev
    ```

---

## 🔐 Default Access

*   **User Login**: `HR@gmail` / `qwerty`
*   **Admin Dashboard**: `admin123` / `admin@123`

---

## 📁 Project Structure

*   `web/`: Modern React/Vite frontend source.
*   `server/`: PHP JSON API, database management, and mail utilities.
*   `database_setup.sql`: SQL scripts for rapid deployment.
*   `legacy-java/`: Historical JavaFX source code (archived).

---

Developed with ❤️ for efficient business operations.
