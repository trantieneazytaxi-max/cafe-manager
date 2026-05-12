let io;

module.exports = {
    init: (httpServer) => {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            console.log('⚡ New client connected:', socket.id);

            socket.on('join-admin', () => {
                socket.join('admin-room');
                console.log(`👤 Socket ${socket.id} joined admin-room`);
            });

            socket.on('join-staff', () => {
                socket.join('staff-room');
                console.log(`👤 Socket ${socket.id} joined staff-room`);
            });

            socket.on('disconnect', () => {
                console.log('❌ Client disconnected');
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
