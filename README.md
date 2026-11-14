# Pet Shop Grooming Management System

A Node.js, Express, and SQLite system for managing customers, pets, inventory, grooming appointments, pet pickups, point-of-sale transactions, user accounts, database backups, and dashboard activity.

---

## How to Start the System

### Requirements

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/)

### Quick Start Steps

1. **Open a terminal** in the project directory:
   ```powershell
   cd "c:\Users\Windows 10\Documents\pet-shop-grooming-system"
   ```

2. **Install dependencies** (if not yet installed):
   ```powershell
   npm install
   ```

3. **Configure Environment File**:
   If `.env` does not exist, copy `.env.example`:
   ```powershell
   Copy-Item .env.example .env
   ```
   Default `.env` configuration:
   ```env
   PORT=3000
   JWT_SECRET=your_secret_key_here
   LOW_STOCK_DEFAULT=5
   ```

4. **(Optional) Load / Reset Sample Data**:
   To seed sample accounts, customers, pets, inventory items, and grooming schedules:
   ```powershell
   npm run seed
   ```

5. **Start the server**:
   ```powershell
   npm start
   ```

6. **Access the application in your browser**:
   - Staff / Admin Portal & Login: [http://localhost:3000](http://localhost:3000)
   - Customer Portal: [http://localhost:3000/customer-dashboard.html](http://localhost:3000/customer-dashboard.html)
   - Public Booking Page: [http://localhost:3000/book.html](http://localhost:3000/book.html)

7. **To stop the server**:
   In the terminal running the server, press `Ctrl + C`.

---

## Default Login Credentials

| Username | Password | Role | Description |
| --- | --- | --- | --- |
| `admin` | `admin123` | Administrator | Full access to users, backups, audit trails, and deletion |
| `staff_anna` | `staff123` | Staff | Access to POS, inventory, customers, pets, and grooming schedules |
| `staff_mark` | `staff123` | Staff | Access to POS, inventory, customers, pets, and grooming schedules |

*New customers can register their account directly on the login page via **Create an account** or sign in to access the **My Pet Appointments** customer portal.*

---

## Recent Updates & Enhancements

### 1. Online Booking & 1-Push Grooming Schedule Registration
- **Customer Online Appointments**: When a registered customer logs in and appoints a schedule through their portal (`customer-dashboard.html`), the appointment is automatically linked to their profile and recorded in the system with status `Pending`.
- **1-Push Registration for Staff & Admin**: 
  - In the **Grooming schedules** screen, a dedicated **Pending Online Appointments** card alerts staff/admin to incoming requests.
  - Staff or whoever is in charge can register the appointment into the official grooming schedule in **one push** (clicking **Register in 1 Push** or **Register**).
  - The status immediately updates from `Pending` to `Scheduled`, updates the live dashboard counters, and displays as **Registered** on the customer's dashboard in real time.
- **Audit Logging**: Every appointment request and 1-push registration is automatically timestamped and appended to the system audit trail.

### 2. Duplicate Item Name Prevention
- **Unique Item Names**: When entering a product in **Inventory Management**, the system checks if an item with the same name already exists (case-insensitive, e.g., *"Dog Food"* vs *"dog food"*).
- **Client & Server Validation**:
  - Frontend checks existing inventory and blocks duplicate submission with an instant alert.
  - Server API validates incoming names on both creation and modification, returning a clear error: `An item named "..." already exists. Duplicate item names cannot be input.`
  - SQLite database includes a unique index (`product_name_unique`) on `LOWER(TRIM(name))` ensuring strict database integrity.

### 3. Scrollable Database Backup & Recovery Audit Trail
- **Scrollable Trail (No Side Overflow)**: The system log and audit trail (`#system-log`) is wrapped in a constrained scroll container (`max-height: 300px; max-width: 100%; overflow-y: auto; overflow-x: auto; white-space: pre-wrap; word-break: break-word`).
- **Clean Layout**: Long log entries wrap cleanly and scroll smoothly within the container without stretching the layout horizontally or getting long in the side.
- **Trail Switcher & Refresh**: Admins can switch between **System trail** and **Error trail** using a dropdown and refresh the trail on demand.
- **Scrollable Backup Archive**: Backup files list is presented inside a vertical scroll container for clean navigation.

---

## Core System Features

### Dashboard
- Real-time counters for:
  - Grooming appointments scheduled for today
  - Pending online appointment requests (clickable quick link)
  - Sales total today
  - Low-stock inventory items
  - Total customers and pets
- Live system clock updated every second.

### Point of Sale (POS)
- Search products by name and filter by category.
- Cart management with quantity calculation and stock deduction.
- Supports **Cash**, **Card**, and **GCash** (with 13-digit reference number and account name validation).
- Calculates change tendered for cash payments.

### Inventory Management
- Tracks Item Name, Category, Price, Stock Quantity, Reorder Level, and Barcode.
- Categories: `Food`, `Grooming`, `Accessories`, `Treats`, `Health & Care`, `Toys`, `Cleaning & Hygiene`, `Pet Supplies`.
- Low-stock warning alerts when stock is at or below the reorder level.

### Customers & Pets
- Customer profiles with unique ID (`CUST-XXXX`), contact details, and address.
- Pet records with unique Pet Code (`PXXXX`), species, breed, and age, linked to the registered owner.
- Complete customer history with pet counts, grooming counts, and purchase history.

### Grooming Appointments
- Supports walk-in bookings and customer online booking.
- Standard grooming packages:
  - Full Grooming Package (PHP 850.00)
  - Basic Shower & Blow Dry (PHP 450.00)
  - Anti-Flea & Tick Treatment (PHP 350.00)
  - De-Shedding & De-Matting (PHP 300.00)
  - Puppy / Kitten First Bath (PHP 300.00)
  - Nail Trimming & Filing (PHP 150.00)
  - Ear Cleaning & Plucking (PHP 150.00)
  - Teeth Brushing & Breath Care (PHP 120.00)

### Authorized Pet Pickup
- Pickup authorization tracking with verified representative, relationship, contact, ID presentation, and staff verification before release.

### Database Backup & Recovery
- Stored under `database/backups/`.
- Administrators can create on-demand timestamped backups and stage restores.
- View system and error audit logs in the scrollable log viewer.
