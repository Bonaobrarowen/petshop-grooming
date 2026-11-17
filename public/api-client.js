// Universal API client: calls the local backend when available and uses browser-local demo data on static hosts.

(function () {
  const STORAGE_KEY = 'petshop_local_db_v1';

  function initDb() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) {
      try {
        const db = JSON.parse(existing);
        const demoCustomers = [
          { username: 'juan', password: 'customer123', full_name: 'Juan Dela Cruz', role: 'Customer', customer_id: 1, status: 'Active' },
          { username: 'maria', password: 'customer123', full_name: 'Maria Clara', role: 'Customer', customer_id: 2, status: 'Active' }
        ];
        let changed = false;
        for (const user of demoCustomers) {
          if (!db.users.some(existingUser => existingUser.username.toLowerCase() === user.username)) {
            const userId = Math.max(0, ...db.users.map(existingUser => Number(existingUser.user_id) || 0)) + 1;
            db.users.push({ ...user, user_id: userId });
            changed = true;
          }
        }
        if (changed) saveDb(db);
        return db;
      } catch (e) {}
    }
    const seed = {
      users: [
        { user_id: 1, username: 'admin', password: 'admin123', full_name: 'System Administrator', role: 'Administrator', status: 'Active' },
        { user_id: 2, username: 'staff_anna', password: 'staff123', full_name: 'Anna Reyes', role: 'Staff', status: 'Active' },
        { user_id: 3, username: 'staff_mark', password: 'staff123', full_name: 'Mark Santos', role: 'Staff', status: 'Active' },
        { user_id: 4, username: 'juan', password: 'customer123', full_name: 'Juan Dela Cruz', role: 'Customer', customer_id: 1, status: 'Active' },
        { user_id: 5, username: 'maria', password: 'customer123', full_name: 'Maria Clara', role: 'Customer', customer_id: 2, status: 'Active' }
      ],
      customers: [
        { customer_id: 1, customer_identity: 'CUST-0001', full_name: 'Juan Dela Cruz', phone: '09171234567', email: 'juan@gmail.com', address: '123 Main St, Manila' },
        { customer_id: 2, customer_identity: 'CUST-0002', full_name: 'Maria Clara', phone: '09189876543', email: 'maria@gmail.com', address: '456 Sampaguita St, Quezon City' },
        { customer_id: 3, customer_identity: 'CUST-0003', full_name: 'Pedro Penduko', phone: '09195551234', email: 'pedro@gmail.com', address: '789 Mabini St, Makati' },
        { customer_id: 4, customer_identity: 'CUST-0004', full_name: 'Ana Santos', phone: '09181234501', email: 'ana.santos@gmail.com', address: '12 Rizal Ave, Pasig' },
        { customer_id: 5, customer_identity: 'CUST-0005', full_name: 'Carlo Mendoza', phone: '09181234502', email: 'carlo.mendoza@gmail.com', address: '25 Luna St, Taguig' }
      ],
      pets: [
        { pet_id: 1, pet_code: 'P9AB2', customer_id: 1, name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', age: 3 },
        { pet_id: 2, pet_code: 'PK4M8', customer_id: 1, name: 'Milo', species: 'Cat', breed: 'Siamese', age: 2 },
        { pet_id: 3, pet_code: 'P7TX1', customer_id: 2, name: 'Bella', species: 'Dog', breed: 'Poodle', age: 4 },
        { pet_id: 4, pet_code: 'PW3Z9', customer_id: 3, name: 'Luna', species: 'Cat', breed: 'Persian', age: 1 }
      ],
      products: [
        { product_id: 1, name: 'Premium Adult Dog Food (5kg)', category: 'Food', price: 650, stock_quantity: 15, reorder_level: 5, barcode: 'PET100001' },
        { product_id: 2, name: 'Kitten Milk Replacer (300g)', category: 'Food', price: 350, stock_quantity: 3, reorder_level: 5, barcode: 'PET100002' },
        { product_id: 3, name: 'Anti-Tick & Flea Dog Shampoo', category: 'Grooming', price: 280, stock_quantity: 12, reorder_level: 4, barcode: 'PET100003' },
        { product_id: 4, name: 'Stainless Steel Pet Bowl', category: 'Accessories', price: 150, stock_quantity: 25, reorder_level: 10, barcode: 'PET100004' },
        { product_id: 5, name: 'Chewable Dental Treats (Pack)', category: 'Treats', price: 120, stock_quantity: 2, reorder_level: 5, barcode: 'PET100005' },
        { product_id: 6, name: 'Cat Scratching Post', category: 'Accessories', price: 850, stock_quantity: 6, reorder_level: 2, barcode: 'PET100006' },
        { product_id: 7, name: 'De-shedding Pet Brush', category: 'Grooming', price: 220, stock_quantity: 8, reorder_level: 3, barcode: 'PET100007' }
      ],
      appointments: [
        { appointment_id: 1, pet_id: 1, service: 'Full Grooming Package', appointment_date: '2026-11-20 10:00', price: 850, status: 'Scheduled' },
        { appointment_id: 2, pet_id: 3, service: 'Basic Shower & Blow Dry', appointment_date: '2026-11-20 11:30', price: 450, status: 'Scheduled' },
        { appointment_id: 3, pet_id: 2, service: 'Anti-Flea & Tick Treatment', appointment_date: '2026-11-20 14:00', price: 350, status: 'Scheduled' }
      ],
      pickups: [
        { pickup_id: 1, pet_id: 1, person_name: 'Clara Dela Cruz', relationship: 'Authorized representative', contact: '09170001122', id_presented: 1, authorization_status: 'Verified', released_at: '2026-11-06 12:00:00' },
        { pickup_id: 2, pet_id: 3, person_name: 'Jose Clara', relationship: 'Authorized representative', contact: '09181112233', id_presented: 1, authorization_status: 'Pending', released_at: null }
      ],
      sales: [
        { sale_id: 1, customer_id: 1, user_id: 2, sale_date: '2026-11-05 09:15:00', total_amount: 650, sold_products: 'Premium Adult Dog Food (5kg)', customer: 'Juan Dela Cruz', customer_phone: '09171234567', customer_pets: 'Buddy, Milo', cashier: 'Anna Reyes', method: 'Cash', reference_number: null }
      ],
      backups: ['backup-initial-seed.db'],
      logs: [
        `${new Date().toISOString()} System initialized on GitHub Pages deployment`,
        `${new Date().toISOString()} Sample database records loaded`
      ]
    };
    saveDb(seed);
    return seed;
  }

  function saveDb(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function getUserFromToken(token) {
    if (!token) return null;
    try {
      const parsed = JSON.parse(atob(token.split('.')[1] || ''));
      return parsed;
    } catch (e) {
      const db = initDb();
      return db.users.find(u => String(u.user_id) === String(token)) || null;
    }
  }

  function mockToken(u) {
    return 'mock.' + btoa(JSON.stringify({ id: u.user_id, name: u.full_name, role: u.role, customer_id: u.customer_id })) + '.sig';
  }

  function addLog(db, msg) {
    db.logs.unshift(`${new Date().toISOString()} ${msg}`);
    if (db.logs.length > 100) db.logs.pop();
  }

  async function clientDb(path, method, body, token) {
    const db = initDb();
    const currentUser = getUserFromToken(token);
    const cleanPath = path.split('?')[0];
    if (cleanPath.startsWith('/auth/password-reset/')) {
      throw new Error('Password recovery requires the application server and configured SMTP email.');
    }

    // Auth Login
    if (cleanPath === '/auth/login' && method === 'POST') {
      const u = db.users.find(x => x.username.toLowerCase() === String(body.username || '').toLowerCase());
      if (!u || u.password !== body.password) {
        addLog(db, `Failed login for "${body.username}" (client mode)`);
        saveDb(db);
        throw new Error('Wrong username or password');
      }
      addLog(db, `Login: ${u.username} (client mode)`);
      saveDb(db);
      return { token: mockToken(u), user: { id: u.user_id, name: u.full_name, role: u.role } };
    }

    // Auth Signup
    if (cleanPath === '/auth/signup' && method === 'POST') {
      const username = String(body.username || '').trim();
      const email = String(body.email || '').trim();
      const password = String(body.password || '');
      if (!String(body.fullName || '').trim() || !email || !username || !password) throw new Error('Full name, email, username, and password are required');
      if (username.length < 3) throw new Error('Username must be at least 3 characters');
      if (password.length < 8) throw new Error('Password must be at least 8 characters');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address');
      if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error('Username is already taken');
      }
      const custId = Math.max(0, ...db.customers.map(c => Number(c.customer_id) || 0)) + 1;
      const newCust = {
        customer_id: custId,
        customer_identity: `CUST-${String(custId).padStart(4, '0')}`,
        full_name: String(body.fullName || '').trim(),
        phone: String(body.phone || '').trim(),
        email,
        address: String(body.address || '').trim()
      };
      db.customers.push(newCust);
      const newUserId = Math.max(0, ...db.users.map(u => Number(u.user_id) || 0)) + 1;
      const newUser = {
        user_id: newUserId,
        username,
        password,
        full_name: newCust.full_name,
        role: 'Customer',
        customer_id: custId,
        status: 'Active'
      };
      db.users.push(newUser);
      addLog(db, `Signup: ${newUser.username} (client mode)`);
      saveDb(db);
      return { token: mockToken(newUser), user: { id: newUser.user_id, name: newUser.full_name, role: newUser.role } };
    }

    // Customer Profile
    if (cleanPath === '/customer/profile') {
      if (!currentUser) throw new Error('Please log in');
      const cust = db.customers.find(c => c.customer_id === currentUser.customer_id) || db.customers[0];
      return cust;
    }

    // Customer Appointments
    if (cleanPath === '/customer/appointments' && method === 'GET') {
      if (!currentUser) throw new Error('Please log in');
      const custId = currentUser.customer_id;
      const petIds = new Set(db.pets.filter(p => p.customer_id === custId).map(p => p.pet_id));
      return db.appointments
        .filter(a => petIds.has(a.pet_id))
        .map(a => {
          const pet = db.pets.find(p => p.pet_id === a.pet_id);
          return { ...a, pet_name: pet?.name || 'Pet' };
        })
        .reverse();
    }

    // Customer / Public Book Appointment
    if ((cleanPath === '/customer/appointments' || cleanPath === '/public/appointments') && method === 'POST') {
      let cust = currentUser?.customer_id ? db.customers.find(c => c.customer_id === currentUser.customer_id) : null;
      if (!cust) {
        cust = db.customers.find(c => c.full_name.toLowerCase() === String(body.full_name || '').trim().toLowerCase() && c.phone === String(body.phone || '').trim());
      }
      if (!cust) {
        const nextId = db.customers.length + 1;
        cust = {
          customer_id: nextId,
          customer_identity: `CUST-${String(nextId).padStart(4, '0')}`,
          full_name: String(body.full_name || '').trim(),
          phone: String(body.phone || '').trim(),
          email: String(body.email || '').trim(),
          address: String(body.address || '').trim()
        };
        db.customers.push(cust);
      }
      let pet = db.pets.find(p => p.customer_id === cust.customer_id && p.name.toLowerCase() === String(body.pet_name || '').trim().toLowerCase());
      if (!pet) {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const code = `P${Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')}`;
        pet = {
          pet_id: db.pets.length + 1,
          pet_code: code,
          customer_id: cust.customer_id,
          name: String(body.pet_name || '').trim(),
          species: 'Dog',
          breed: String(body.breed || '').trim(),
          age: Number(body.age) || 1
        };
        db.pets.push(pet);
      }
      const rawDate = String(body.appointment_date || '').replace('T', ' ').slice(0, 16);
      const apptPrices = {
        'Full Grooming Package': 850, 'Basic Shower & Blow Dry': 450, 'Nail Trimming & Filing': 150,
        'Ear Cleaning & Plucking': 150, 'Anti-Flea & Tick Treatment': 350, 'De-Shedding & De-Matting': 300,
        'Teeth Brushing & Breath Care': 120, 'Puppy / Kitten First Bath': 300
      };
      const newAppt = {
        appointment_id: db.appointments.length + 1,
        pet_id: pet.pet_id,
        service: body.service,
        appointment_date: rawDate,
        price: apptPrices[body.service] || 850,
        status: 'Pending'
      };
      db.appointments.push(newAppt);
      addLog(db, `Appointment request #${newAppt.appointment_id} (${pet.name} - ${newAppt.service}) submitted for ${cust.full_name}`);
      saveDb(db);
      return { appointment_id: newAppt.appointment_id, message: 'Appointment request submitted. Waiting for staff to register your schedule in the system.' };
    }

    // 1-Push Appointment Register
    if (/^\/appointments\/\d+\/register$/.test(cleanPath) && method === 'POST') {
      const id = Number(cleanPath.split('/')[2]);
      const appt = db.appointments.find(a => a.appointment_id === id);
      if (!appt) throw new Error('Appointment not found');
      if (appt.status !== 'Pending') throw new Error('Only pending appointment requests can be registered');
      appt.status = 'Scheduled';
      const pet = db.pets.find(p => p.pet_id === appt.pet_id);
      const cust = db.customers.find(c => c.customer_id === pet?.customer_id);
      addLog(db, `Appointment #${id} for ${pet?.name || 'Pet'} (${cust?.full_name || 'Customer'}) registered into schedule by ${currentUser?.name || 'Staff'}`);
      saveDb(db);
      return { ok: true, appointment_id: id, message: `Appointment #${id} for ${pet?.name || 'Pet'} successfully registered in grooming schedule.` };
    }
    if (/^\/appointments\/\d+\/complete$/.test(cleanPath) && method === 'POST') {
      const id = Number(cleanPath.split('/')[2]);
      const appt = db.appointments.find(a => a.appointment_id === id);
      if (!appt) throw new Error('Appointment not found');
      if (appt.status !== 'Scheduled' && appt.status !== 'Done') throw new Error('Only scheduled appointments can be marked done');
      const pet = db.pets.find(p => p.pet_id === appt.pet_id);
      const cust = db.customers.find(c => c.customer_id === pet?.customer_id);
      let pickup = db.pickups.find(p => p.appointment_id === id);
      if (!pickup) {
        pickup = {
          pickup_id: Math.max(0, ...db.pickups.map(p => p.pickup_id)) + 1,
          appointment_id: id,
          pet_id: appt.pet_id,
          person_name: cust?.full_name || 'Pet owner',
          relationship: 'Owner',
          contact: cust?.phone || '',
          id_presented: 0,
          authorization_status: 'Pending',
          released_at: null
        };
        db.pickups.push(pickup);
      }
      appt.status = 'Done';
      addLog(db, `Appointment #${id} for ${pet?.name || 'Pet'} marked done; added to pet pickup verification`);
      saveDb(db);
      return { ok: true, appointment_id: id, pickup_id: pickup.pickup_id, message: `${pet?.name || 'Pet'} is ready for pickup verification.` };
    }

    // Appointments list / CRUD
    if (cleanPath === '/appointments') {
      if (method === 'GET') {
        return db.appointments.map(a => {
          const pet = db.pets.find(p => p.pet_id === a.pet_id) || {};
          const cust = db.customers.find(c => c.customer_id === pet.customer_id) || {};
          return {
            appointment_id: a.appointment_id,
            pet_id: a.pet_id,
            pet_code: pet.pet_code || '',
            pet_name: pet.name || 'Dog',
            customer_id: cust.customer_id,
            owner_customer_id: cust.customer_identity || '',
            owner_name: cust.full_name || 'Walk-in',
            owner_phone: cust.phone || '',
            service: a.service,
            appointment_date: a.appointment_date,
            price: a.price,
            status: a.status
          };
        }).reverse();
      }
      if (method === 'POST') {
        const id = db.appointments.length + 1;
        const appt = { appointment_id: id, ...body, status: 'Scheduled' };
        db.appointments.push(appt);
        saveDb(db);
        return appt;
      }
    }
    if (/^\/appointments\/\d+$/.test(cleanPath) && method === 'DELETE') {
      const id = Number(cleanPath.split('/')[2]);
      db.appointments = db.appointments.filter(a => a.appointment_id !== id);
      saveDb(db);
      return { ok: true };
    }

    // Users CRUD for Staff / Administrator accounts
    if (cleanPath === '/users') {
      if (currentUser?.role !== 'Administrator') throw new Error('Administrator access required');
      if (method === 'GET') {
        return db.users
          .map(u => ({ user_id: u.user_id, username: u.username, full_name: u.full_name, email: u.email || '', role: u.role, status: u.status }))
          .reverse();
      }
      if (method === 'POST') {
        const username = String(body.username || '').trim();
        if (!username) throw new Error('Username is required');
        if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
          throw new Error('Username is already taken');
        }
        const id = db.users.length + 1;
        const newUser = {
          user_id: id,
          username,
          password: String(body.password || '').trim(),
          full_name: String(body.full_name || '').trim() || username,
          email: String(body.email || '').trim(),
          role: String(body.role || 'Staff'),
          status: String(body.status || 'Active'),
          customer_id: body.customer_id || null
        };
        db.users.push(newUser);
        addLog(db, `Created user account: ${username} (${newUser.role})`);
        saveDb(db);
        return { user_id: newUser.user_id, username: newUser.username, full_name: newUser.full_name, role: newUser.role, status: newUser.status };
      }
    }
    if (/^\/users\/\d+$/.test(cleanPath)) {
      if (currentUser?.role !== 'Administrator') throw new Error('Administrator access required');
      const id = Number(cleanPath.split('/')[2]);
      if (method === 'PUT') {
        const idx = db.users.findIndex(u => u.user_id === id);
        if (idx < 0) throw new Error('User not found');
        const updated = { ...db.users[idx], ...body };
        if (body.username) updated.username = String(body.username).trim();
        if (body.full_name) updated.full_name = String(body.full_name).trim();
        if (body.password !== undefined) updated.password = String(body.password).trim();
        if (body.role) updated.role = String(body.role);
        if (body.status) updated.status = String(body.status);
        db.users[idx] = updated;
        addLog(db, `Updated user account: ${updated.username} (${updated.role})`);
        saveDb(db);
        return { user_id: updated.user_id, username: updated.username, full_name: updated.full_name, email: updated.email || '', role: updated.role, status: updated.status };
      }
      if (method === 'DELETE') {
        const before = db.users.length;
        db.users = db.users.filter(u => u.user_id !== id);
        if (db.users.length === before) throw new Error('User not found');
        addLog(db, `Deleted user account #${id}`);
        saveDb(db);
        return { ok: true };
      }
    }

    // Products CRUD with duplicate name check
    if (cleanPath === '/products') {
      if (method === 'GET') return [...db.products].reverse();
      if (method === 'POST') {
        const name = String(body.name || '').trim();
        if (db.products.some(p => p.name.trim().toLowerCase() === name.toLowerCase())) {
          throw new Error(`An item named "${name}" already exists. Duplicate item names cannot be input.`);
        }
        const newProduct = { product_id: db.products.length + 1, ...body, name };
        db.products.push(newProduct);
        addLog(db, `Added inventory item: ${name}`);
        saveDb(db);
        return newProduct;
      }
    }
    if (/^\/products\/\d+$/.test(cleanPath)) {
      const id = Number(cleanPath.split('/')[2]);
      if (method === 'PUT') {
        if (body.name) {
          const name = String(body.name || '').trim();
          if (db.products.some(p => p.product_id !== id && p.name.trim().toLowerCase() === name.toLowerCase())) {
            throw new Error(`An item named "${name}" already exists. Duplicate item names cannot be input.`);
          }
        }
        const idx = db.products.findIndex(p => p.product_id === id);
        if (idx >= 0) db.products[idx] = { ...db.products[idx], ...body };
        saveDb(db);
        return db.products[idx];
      }
      if (method === 'DELETE') {
        db.products = db.products.filter(p => p.product_id !== id);
        saveDb(db);
        return { ok: true };
      }
    }

    // Customers list / add
    if (cleanPath === '/customers') {
      if (method === 'GET') {
        return db.customers.map(c => ({
          ...c,
          pet_count: db.pets.filter(p => p.customer_id === c.customer_id).length,
          grooming_count: db.appointments.filter(a => {
            const pet = db.pets.find(p => p.pet_id === a.pet_id);
            return pet && pet.customer_id === c.customer_id;
          }).length,
          sales_count: db.sales.filter(s => s.customer_id === c.customer_id).length
        })).reverse();
      }
      if (method === 'POST') {
        const id = db.customers.length + 1;
        const c = { customer_id: id, customer_identity: `CUST-${String(id).padStart(4, '0')}`, ...body };
        db.customers.push(c);
        saveDb(db);
        return c;
      }
    }

    // Pets list / add
    if (cleanPath === '/pets') {
      if (method === 'GET') {
        return db.pets.map(p => {
          const c = db.customers.find(x => x.customer_id === p.customer_id) || {};
          return {
            ...p,
            owner_customer_id: c.customer_identity || '',
            owner_name: c.full_name || '',
            owner_phone: c.phone || ''
          };
        }).reverse();
      }
      if (method === 'POST') {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const code = `P${Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')}`;
        const p = { pet_id: db.pets.length + 1, pet_code: code, ...body };
        db.pets.push(p);
        saveDb(db);
        return p;
      }
    }

    // Dashboard
    if (cleanPath === '/dashboard') {
      const todayStr = new Date().toISOString().slice(0, 10);
      return {
        customers: db.customers.length,
        pets: db.pets.length,
        appointments_today: db.appointments.filter(a => a.status === 'Scheduled' && a.appointment_date.startsWith(todayStr)).length,
        pending_appointments: db.appointments.filter(a => a.status === 'Pending').length,
        low_stock: db.products.filter(p => p.stock_quantity <= p.reorder_level).length,
        sales_today: db.sales.filter(s => s.sale_date.startsWith(todayStr)).reduce((sum, s) => sum + (s.total_amount || 0), 0)
      };
    }

    // Low stock
    if (cleanPath === '/low-stock') {
      return db.products.filter(p => p.stock_quantity <= p.reorder_level);
    }

    // Sales list & Checkout
    if (cleanPath === '/sales') return [...db.sales].reverse();
    if (cleanPath === '/sales/checkout' && method === 'POST') {
      const { customer_id, items, method: payMethod = 'Cash', account_name = '', reference_number = '' } = body;
      let total = 0;
      const soldNames = [];
      for (const item of items) {
        const p = db.products.find(x => x.product_id === item.product_id);
        if (!p || p.stock_quantity < item.quantity) {
          throw new Error(`Not enough stock for ${p ? p.name : 'product'}`);
        }
        p.stock_quantity -= item.quantity;
        total += p.price * item.quantity;
        soldNames.push(p.name);
      }
      const cust = db.customers.find(c => c.customer_id === customer_id);
      const sale = {
        sale_id: db.sales.length + 1,
        customer_id,
        user_id: currentUser?.id || 1,
        sale_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
        total_amount: total,
        sold_products: soldNames.join(', '),
        customer: cust?.full_name || 'Walk-in',
        customer_phone: cust?.phone || '',
        cashier: currentUser?.name || 'Staff',
        method: payMethod,
        reference_number: reference_number || null
      };
      db.sales.push(sale);
      addLog(db, `Sale #${sale.sale_id} total PHP ${total} completed by ${currentUser?.name || 'Staff'}`);
      saveDb(db);
      return sale;
    }

    // Pickups
    if (cleanPath === '/pickups') return [...db.pickups].reverse();
    if (/^\/pickups\/\d+\/verify$/.test(cleanPath) && method === 'POST') {
      const id = Number(cleanPath.split('/')[2]);
      const pick = db.pickups.find(p => p.pickup_id === id);
      if (!pick) throw new Error('Pickup record not found');
      if (pick.released_at) throw new Error('This pet was already released');
      if (pick.authorization_status === 'Rejected') throw new Error('Rejected pickup authorization cannot be verified');
      pick.id_presented = 1;
      pick.authorization_status = 'Verified';
      addLog(db, `ID checked for pickup #${id} (${pick.person_name}) by ${currentUser?.name || 'Staff'}`);
      saveDb(db);
      return pick;
    }
    if (/^\/pickups\/\d+\/release$/.test(cleanPath) && method === 'POST') {
      const id = Number(cleanPath.split('/')[2]);
      const pick = db.pickups.find(p => p.pickup_id === id);
      if (!pick) throw new Error('Pickup record not found');
      if (pick.released_at) throw new Error('This pet was already released');
      if (!pick.id_presented || pick.authorization_status !== 'Verified') throw new Error('Verify the authorized person and their ID before release');
      pick.released_at = new Date().toISOString().replace('T', ' ').slice(0, 19);
      addLog(db, `Pet pickup #${id} released by ${currentUser?.name || 'Staff'}`);
      saveDb(db);
      return pick;
    }

    // Backups & Logs
    if (cleanPath === '/admin/backups') return db.backups || [];
    if (cleanPath === '/admin/backup' && method === 'POST') {
      const f = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
      db.backups.unshift(f);
      addLog(db, `Backup created: ${f} by ${currentUser?.name || 'Admin'}`);
      saveDb(db);
      return { file: f };
    }
    if (cleanPath === '/admin/restore' && method === 'POST') {
      addLog(db, `Restore staged for ${body.file} by ${currentUser?.name || 'Admin'}`);
      saveDb(db);
      return { message: 'Restore staged successfully.' };
    }
    if (cleanPath === '/admin/logs') {
      return { lines: db.logs || [] };
    }

    return [];
  }

  // Universal API caller
  window.petshopApi = async function (path, method = 'GET', body, token) {
    const isStaticDeploy = location.hostname.endsWith('github.io') || location.protocol === 'file:';
    const cleanPath = path.split('?')[0];
    const requiresSharedBackend = method === 'POST' &&
      ['/auth/signup', '/customer/appointments', '/public/appointments'].includes(cleanPath);
    const sharedBackendError = 'This GitHub Pages demo cannot save new customer registrations or appointments. These actions need a shared application server.';
    if (isStaticDeploy && requiresSharedBackend) throw new Error(sharedBackendError);
    if (!isStaticDeploy) {
      try {
        const response = await fetch('/api' + path, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: 'Bearer ' + token } : {})
          },
          body: body !== undefined ? JSON.stringify(body) : undefined
        });
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json().catch(() => ({}));
          if (response.status === 401) {
            localStorage.removeItem('tok');
            localStorage.removeItem('me');
            throw new Error('Please sign in');
          }
          if (!response.ok) throw new Error(data.error || 'Request failed');
          return data;
        }
      } catch (err) {
        if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError')) {
          throw err;
        }
        if (requiresSharedBackend) throw new Error(sharedBackendError);
      }
    }
    if (requiresSharedBackend) throw new Error(sharedBackendError);
    // Fallback to in-browser storage (GitHub Pages)
    return await clientDb(path, method, body, token);
  };
})();
