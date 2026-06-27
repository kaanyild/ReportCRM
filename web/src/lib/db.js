import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'clients.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

// Initialize file if not exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

export function getClients() {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

export function getClient(id) {
  const clients = getClients();
  return clients.find(c => c.id === id);
}

export function saveClient(client) {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === client.id);
  if (index >= 0) {
    clients[index] = client;
  } else {
    clients.push({ ...client, id: Date.now().toString() });
  }
  fs.writeFileSync(dbPath, JSON.stringify(clients, null, 2));
}

export function deleteClient(id) {
  const clients = getClients();
  const filtered = clients.filter(c => c.id !== id);
  fs.writeFileSync(dbPath, JSON.stringify(filtered, null, 2));
}
