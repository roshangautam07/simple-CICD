const WebSocket = require('ws');
const prompt = require('prompt-sync')({ sigint: true });

// Get command-line arguments
const [action, repoUrl, destination] = process.argv.slice(2);

if (!action  || !destination) {
  console.error('Usage: node client.js <action> <repoUrl> <destination>');
  process.exit(1);
}

// Prompt the user for Git credentials
const username = prompt('Username: ');
const serverIp = prompt('Server: ');
const password = prompt('Password: ', { echo: '*' });

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to the server.');

  // Send a request to perform the Git action with authentication
  ws.send(JSON.stringify({
    action,
    repoUrl: `https://${username}:${password}@${repoUrl.split('://')[1]}`,
    destination,
    serverIp,
    username,
    password
  }));
});

ws.on('message', (message) => {
  console.log(message.toString());
});

ws.on('close', () => {
  console.log('Connection closed.');
});

ws.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});
