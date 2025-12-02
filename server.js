const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const db = require('./db');
const app = express();
const port = 3003;
const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',        // isi kalau ada
  database: 'latihan_express',
  waitForConnections: true,
  connectionLimit: 10
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

app.use(session({
  secret: 'uas-secret',
  resave: false,
  saveUninitialized: true
}));

// ================= AUTH =================

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password]
  );

  if (rows.length > 0) {
    req.session.user = rows[0];
    res.redirect('/');
  } else {
    res.send('Login gagal');
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  await db.query(
    'INSERT INTO users VALUES (NULL, ?, ?, ?)',
    [username, email, password]
  );
  res.redirect('/login');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// ================= HOME =================

app.get('/', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('index', { nama: req.session.user.username });
});

// ================= STATIC =================

app.get('/about', (req, res) => {
  res.render('about', { nama: 'Ichacantik' });
});

app.get('/contact', (req, res) => res.render('contact'));

// ================= PRODUK (CRUD) =================

app.get('/product', async (req, res) => {
  const [rows] = await dbPool.query('SELECT * FROM produk');
  res.render('product', { produk: rows });
});

app.get('/product/:id', async (req, res) => {
  const { id } = req.params;

  const [rows] = await dbPool.query(
    'SELECT * FROM produk WHERE id = ?',
    [id]
  );

  res.render('detail-product', { produk: rows[0] });
});

app.get('/create-product', (req, res) => {
  res.render('create');
});

app.post('/create-product',
  upload.single('gambar'),
  async (req, res) => {

    const { name, harga, stock } = req.body;
    const gambar = '/img/' + req.file.filename;

    await dbPool.query(
      'INSERT INTO produk (nama, harga, stock, gambar) VALUES (?, ?, ?, ?)',
      [name, harga, stock, gambar]
    );

    res.redirect('/product');
});

app.get('/edit-product/:id', async (req, res) => {
  const { id } = req.params;

  const [rows] = await dbPool.query(
    'SELECT * FROM produk WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    return res.send('Produk tidak ditemukan');
  }

  res.render('edit', {
    produk: rows[0]
  });
});

app.post('/edit-product/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, harga, stock } = req.body;

  await dbPool.query(
    'UPDATE produk SET nama=?, harga=?, stock=? WHERE id=?',
    [nama, harga, stock, id]
  );

  res.redirect('/product');
});

app.post('/delete-product/:id', async (req, res) => {
  const { id } = req.params;

  await dbPool.query(
    'DELETE FROM produk WHERE id = ?',
    [id]
  );

  res.redirect('/product');
});

app.listen(port, () => {
  console.log(`✅ Server jalan di http://localhost:${port}`);
});
