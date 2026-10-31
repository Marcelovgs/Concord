const WebSocket = require('ws');

// O Render fornece a porta automaticamente através de process.env.PORT
const PORT = process.env.PORT || 9000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`Servidor de sinalização rodando na porta ${PORT}`);

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        // Reencaminha a mensagem para todos os outros clientes conectados na sala
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    });
});