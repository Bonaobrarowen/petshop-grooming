# Pet Shop Grooming Management System

A Node.js, Express, and SQLite system for managing customers, pets, inventory, grooming appointments, pet pickups, point-of-sale transactions, user accounts, database backups, and dashboard activity.

---

## Run the System

### Requirements

- [Node.js](https://nodejs.org/) (version 20 or higher)
- [npm](https://www.npmjs.com/)
- Windows PowerShell, Command Prompt, or another terminal

### First-time setup

1. **Open a terminal** in the project folder:
   ```powershell
   cd "C:\Users\Windows 10\Documents\pet-shop-grooming-system"
   ```

2. **Install dependencies**:
   ```powershell
   npm install
   ```

3. **Create the environment file** if it does not exist:
   ```powershell
   Copy-Item .env.example .env
   ```
   Set a private JWT secret and configure SMTP for password-reset emails. For example:
   ```env
   PORT=3000
   JWT_SECRET=replace-with-a-private-random-secret
   LOW_STOCK_DEFAULT=5
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-email-app-password
   SMTP_FROM="Pet Shop Grooming <your-email@gmail.com>"
   OTP_SECRET=replace-with-a-private-random-secret-at-least-32-characters-long
   ```
   Generate a random secret for `OTP_SECRET` with:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   `OTP_SECRET` must be at least 32 characters. For Gmail, use an App Password (not your regular account password). Keep `.env` private and restart the server after changing it. SMTP settings are required for password-reset email; without them, the rest of the system can still run but email recovery is unavailable.

4. **Optional: load sample data** on a new/test database:
   ```powershell
   npm run seed
   ```
   **Warning:** seeding clears and replaces the current accounts, customers, pets, products, appointments, pickups, sales, and payments with sample data. Do not run this on a database you need to keep.

### Start and open the system

1. From the project folder, start the backend and web server:
   ```powershell
   npm start
   ```
2. Wait for the message `Pet shop system running at http://localhost:3000`.
3. Open these URLs in a browser:
   - Staff / Admin portal and login: [http://localhost:3000](http://localhost:3000)
   - Customer portal: [http://localhost:3000/customer-dashboard.html](http://localhost:3000/customer-dashboard.html)
   - Public booking page: [http://localhost:3000/book.html](http://localhost:3000/book.html)
4. Keep the terminal open while using the system. To stop the server, press **Ctrl+C** in that terminal.

The server creates or updates the SQLite database at `database/petshop.db` when it starts. A new empty database is initialized with sample records. Open the site through the server URL above; opening an HTML file directly does not provide the backend functions, including OTP email.

---

## Default Login Credentials

| Username | Password | Role | Description |
| --- | --- | --- | --- |
| `admin` | `admin123` | Administrator | Full access to users, backups, audit trails, and deletion |
| `staff_anna` | `staff123` | Staff | Access to POS, inventory, customers, pets, and grooming schedules |
| `staff_mark` | `staff123` | Staff | Access to POS, inventory, customers, pets, and grooming schedules |
| `juan` | `customer123` | Customer | Sample customer portal account |
| `maria` | `customer123` | Customer | Sample customer portal account |

*New customers can register their account directly on the login page via **Create an account** or sign in to access the **My Pet Appointments** customer portal.*

These are sample credentials. Change them before using a deployed system. The seeded staff and administrator accounts do not have recovery emails; an administrator must set their recovery emails in **System users** before those accounts can use OTP recovery.

## Accounts and permissions

- **Staff** can use POS, inventory, customers, pets, and grooming schedules. Staff can add products, add incoming stock to existing products, and register pending online appointments.
- **Administrators** can do staff tasks, add Staff or Administrator accounts, manage recovery emails, create/restore backups, and delete records.
- **Only Administrators** can delete customers. Deleting a customer also deletes their pets and grooming appointments, keeps sales history without its customer link, and deactivates any linked customer login. The confirmation dialog explains this before proceeding.
- **Customers** can register an account with an email address, book grooming appointments, and view their appointment status in the customer portal.
- New staff/admin accounts require a unique username and recovery email, a role, and a password of at least 8 characters. Existing accounts' recovery emails can be changed in **System users**.
- The **System users** page shows separate sections for Staff, Administrator, and Customer accounts.

### Forgot password / OTP

1. On the login page, select **Forgot password?** and enter the account username.
2. If the account is active and has a registered recovery email, the system sends a six-digit OTP to that email.
3. Enter the OTP and a new password of at least 8 characters.

OTP codes expire after 10 minutes, can only be used once, and allow up to five verification attempts. Requests are limited to one email per account per minute. The system stores a hash of the OTP rather than the code itself. The application must be running with valid SMTP settings and an `OTP_SECRET`; configure these in `.env` as described above. Staff/admin accounts use their saved recovery email. Customer accounts use the email saved on their customer profile unless an administrator has set an account-specific recovery email.

---

## Recent Updates & Enhancements

### 1. Online Booking & 1-Push Grooming Schedule Registration
- **Customer Online Appointments**: When a registered customer logs in and appoints a schedule through their portal (`customer-dashboard.html`), the appointment is automatically linked to their profile and recorded in the system with status `Pending`.
- **1-Push Registration for Staff & Admin**: 
  - In the **Grooming schedules** screen, a dedicated **Pending Online Appointments** card alerts staff/admin to incoming requests.
  - Staff or whoever is in charge can register the appointment into the official grooming schedule in **one push** (clicking **Register in 1 Push** or **Register**).
  - The status immediately updates from `Pending` to `Scheduled`, updates the live dashboard counters, and displays as **Registered** on the customer's dashboard in real time.
- **Audit Logging**: Every appointment request and 1-push registration is automatically timestamped and appended to the system audit trail.

### 2. Grooming Completion & Pet Pickup
- A staff member can select **Done** on a scheduled grooming appointment when the service is complete.
- The appointment is removed from the active Grooming schedules list and a pending pickup-verification record is created for the pet, prefilled with the owner's name and phone number.
- The system opens **Pet pickup verification**. Staff check the authorized person's ID with **Verify ID**, then select **Release pet** after verification.
- The completed appointment remains visible in the customer's appointment history as **Done - ready for pickup**.

### 3. Duplicate Item Name Prevention
- **Unique Item Names**: When entering a product in **Inventory Management**, the system checks if an item with the same name already exists (case-insensitive, e.g., *"Dog Food"* vs *"dog food"*).
- **Client & Server Validation**:
  - Frontend checks existing inventory and blocks duplicate submission with an instant alert.
  - Server API validates incoming names on both creation and modification, returning a clear error: `An item named "..." already exists. Duplicate item names cannot be input.`
  - SQLite database includes a unique index (`product_name_unique`) on `LOWER(TRIM(name))` ensuring strict database integrity.

### 4. Inventory stock additions
- Existing products have a **Qty to add** field and **Add stock** button in the inventory list.
- Added stock is summed with the current quantity; it does not replace existing stock. Only positive whole-number quantities are accepted.

### 5. Account and customer management
- Administrators can create Staff and Administrator accounts and set or update their recovery emails from **System users**.
- Customer deletion uses the customer's database ID and is restricted to administrators. The confirmation describes related records affected by deletion.
- The login page supports email-based OTP password recovery when SMTP is configured.

### 6. Scrollable Database Backup & Recovery Audit Trail
- System and error trails are available to administrators, with a refresh control.
- Backup files and long log entries are displayed in scrollable containers to keep the page usable.
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
- Add a new product with its starting stock, or use **Qty to add** on an existing product to record a delivery/restock without overwriting current stock.
- Categories: `Food`, `Grooming`, `Accessories`, `Treats`, `Health & Care`, `Toys`, `Cleaning & Hygiene`, `Pet Supplies`.
- Low-stock warning alerts when stock is at or below the reorder level.

### Customers & Pets
- Customer profiles with unique ID (`CUST-XXXX`), contact details, and address.
- Pet records with unique Pet Code (`PXXXX`), species, breed, and age, linked to the registered owner.
- Complete customer history with pet counts, grooming counts, and purchase history.
- Customer deletion is administrator-only and removes linked pets and grooming appointments; sales history is retained with the customer association cleared.

### User Accounts
- Administrators create Staff or Administrator accounts in **System users** and can update each account's recovery email.
- Staff can add products and register pending online appointments; only administrators can manage users, backups, and deletions.
- **Forgot password** emails a time-limited OTP to the account's recovery email. SMTP and `OTP_SECRET` must be configured in `.env`.

### Grooming Appointments
- Supports walk-in bookings and customer online booking.
- Scheduled appointments can be marked **Done**; they move from the active schedule to **Pet pickup verification**.
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
- Completed grooming appointments create pending pickup records, prefilled with the owner's contact details.
- Staff record ID verification using **Verify ID** before **Release pet** becomes available.
- Tracks the authorized person, relationship, contact, ID presentation, verification, and release.

### Database Backup & Recovery
- Stored under `database/backups/`.
- Administrators can create on-demand timestamped backups and stage restores.
- View system and error audit logs in the scrollable log viewer.
