module.exports = function (io, db) {
  const userSockets = {};
  io.on('connect', (socket) => {
    console.log('a user connected');
    socket.on('login', (user) => {
      userSockets[user.id] = socket.id;
      console.log(userSockets, '-------------------------------userSockets');
      console.log(`User ${user.id} connected with socket id ${socket.id} --------- 유저입장`);
    })

    socket.on('room-make', (data) => {
      console.log(data);
    })
  })
}