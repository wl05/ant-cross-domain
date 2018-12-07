const Koa = require('koa');
const app = new Koa();
const WebSocket = require('ws');
const static = require('koa-static');
const staticPath = './'
const path = require('path')
const wss = new WebSocket.Server({port : 8080});
wss.on('connection', function connection (ws) {
    console.log('server: receive connection.');
    ws.on('message', function incoming (message) {
        console.log('server: received: %s', message);
    });
    ws.send('world');
});

app.use(static(
    path.join(__dirname, staticPath)
))
app.listen(3000);
