import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import https from 'https';
import { lookupPayjoyCustomer } from './payjoy-service.js';

// Background sync for users
let cachedUsers = null;
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzH2a6_gdBJ6uEzmms8qneHg5XnpThtWALqEjgZ9YYcEyMdG1ikYWb68POhtVELJdrdRA/exec?action=getData";

function fetchUsersBackground() {
    https.get(SCRIPT_URL, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    https.get(res.headers.location, (res2) => {
                        let data2 = '';
                        res2.on('data', chunk => data2 += chunk);
                        res2.on('end', () => {
                            try {
                                const parsed = JSON.parse(data2);
                                cachedUsers = { clientes: parsed.data.clientes, config_permisos: parsed.data.config_permisos };
                                fs.writeFileSync(path.join(__dirname, 'dist', 'users.json'), JSON.stringify(cachedUsers));
                            } catch(e) {}
                        });
                    });
                } else {
                    const parsed = JSON.parse(data);
                    cachedUsers = { clientes: parsed.data.clientes, config_permisos: parsed.data.config_permisos };
                    fs.writeFileSync(path.join(__dirname, 'dist', 'users.json'), JSON.stringify(cachedUsers));
                }
            } catch (e) {}
        });
    }).on('error', () => {});
}

// Fetch immediately and then every 10 minutes
fetchUsersBackground();
setInterval(fetchUsersBackground, 10 * 60 * 1000);


const app = express();

app.get("/api/payjoy/lookup", async (req, res) => {
  try {
    const tag = req.query.tag;
    const result = await lookupPayjoyCustomer(tag);
    res.json(result);
  } catch(e) {
    res.status(500).json({ success: false, error: e.message });
  }
});
const PORT = 3000;

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res, next) => {
  // If request has file extension, let express static handle or return 404
  if (req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
