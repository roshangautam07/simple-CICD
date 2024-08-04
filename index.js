const http = require('http');
const WebSocket = require('ws');
const simpleGit = require('simple-git');
const { exec } = require('child_process');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const { repoUrl, destination, action, username, password,serverIp} = JSON.parse(message);

        // SimpleGit instance with output handler
        const git = simpleGit(destination).outputHandler((command, stdout, stderr) => {
            stdout.on('data', (data) => ws.send(`stdout: ${data}`));
            stderr.on('data', (data) => ws.send(`stderr: ${data}`));
        });

        if (action === 'clone') {
            // Clone the repository
            git.clone(repoUrl, destination, ['--progress'])
                .then(() => {
                    ws.send('Cloning completed')
                    ws.close()
                })
                .catch(err => ws.send(`Error: ${err.message}`));
        } else if (action === 'pull') {
            // Pull the latest changes
            git.pull()
                .then(() => {
                    ws.send('Pull completed');
                    ws.close();
                }
                )
                .catch(err => ws.send(`Error: ${err.message}`));
        } else if (action == 'copy') {
            // Using rsync to copy files over SSH
            const remotePath = serverIp;
            const localPath = '.';
            const rsyncCommand = `rsync -avzhe ssh ${localPath} ${username}@${remotePath}:${destination}`;

            const rsync = exec(rsyncCommand);

            rsync.stdout.on('data', (data) => ws.send(`stdout: ${data}`));
            rsync.stderr.on('data', (data) => ws.send(`stderr: ${data}`));

            rsync.on('close', (code) => {
                ws.send(`Copy operation completed with exit code ${code}`);
                ws.close()
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(8080, () => {
    console.log('Server is listening on port 8080');
});
