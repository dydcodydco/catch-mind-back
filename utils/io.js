const {nanoid} = require('nanoid');

module.exports = function (io, db) {
  const userSockets = new Map();
  const rooms = new Map();

  io.on('connect', (socket) => {
    console.log('a user connected');

    socket.on('login', (user) => {
      userSockets.set(user.id, socket.id);
      console.log(userSockets, '-------------------------------login 유저 소켓');
      console.log(`유저 아이디: ${user.id} connected with 소켓 아이디: ${socket.id} --------- 유저입장`);
    });

    // 방 생성
    socket.on('create room', (data) => {
      const decodedRoomName = decodeURIComponent(data.roomName);
      const room = [...rooms.values()].find(d => d.roomName === decodedRoomName);
      const receiverSocketId = userSockets.get(data.id);
      const userId = data.id;
      
      if (room) {
        console.log('----------------이미 있는 방 이름 입니다.');
        io.to(receiverSocketId).emit('create room result', { message: '이미 있는 방 이름 입니다.', result: false });
        return;
      }

      const roomId = nanoid(10);
      rooms.set(roomId, { ...data, roomName: decodedRoomName, users: new Set([userId]) });
      if (receiverSocketId) {
        console.log('--------------------- 방 생성 완료 입니다.');
        // console.log(userSockets);
        socket.join(roomId);
        io.to(receiverSocketId).emit('create room result', { message: '성공', result: true, roomId });
        console.log('--------------------------------------------------------------');
      }
    });

    socket.on('join room', (data) => {
      console.log(data);
      const { roomId, userId } = data;
      console.log('-------------------------방 참여---------------------------')
      const room = rooms.get(roomId);
      console.log(room, '---------------------------room');
      if (room) {
        const socketId = userSockets.get(userId);
        // 방에 처음 들어왔을 때
        if (socketId && !room.users.has(userId)) {
          room.users.add(userId);
          socket.join(roomId);
          socket.to(roomId).emit('join room result', `${room.roomName}에 ${roomId}님이 참여했습니다.`);
          console.log(rooms, '-------------------------방 참여 완료 -----------------------------------');
          if (room.drawings) {
            socket.emit('initializeCanvas', Array.from(room.drawings));
          }
        }

        // 들어온 적 있는 유저가 다시 들어왔을 때
        if (socketId && room.users.has(userId)) {
          socket.join(roomId);
          socket.to(roomId).emit('join room result', `${room.roomName}에 ${roomId}님이 참여했습니다.`);
          console.log(rooms, '-------------------------방 참여 완료 -----------------------------------');
          console.log(userSockets, '-------------------------방 참여 완료 by name -----------------------------------');
          if (room.drawings) {
            socket.emit('initializeCanvas', Array.from(room.drawings));
          }
        }
      } else {
        socket.to(roomId).emit('join room result', `방이 존재하지 않습ㄴ디ㅏ.`);
      }
    });

    // 방 참여
    socket.on('join room by name', (data) => {
      console.log(data);
      const { roomName, password, type, id: userId } = data;
      console.log('-------------------------방 참여 by name---------------------------');
      console.log(userSockets, '------------------------------------userSockets');
      console.log(rooms, '-----------------------------------------rooms');
      const decodedRoomName = decodeURIComponent(roomName);
      if (rooms.size === 0) return;
      const [roomId, room] = [...rooms.entries()].find(([a, b]) => b.roomName === decodedRoomName);
      const socketId = userSockets.get(userId);

      if (room) {
        // 방에 첨 들어왔을 때 
        if (socketId && !room.users.has(userId)) {
          room.users.add(userId);
          socket.join(roomId);
          socket.to(roomId).emit('join room result', { message: `${room.roomName}에 ${roomId}님이 참여했습니다.`, result: true, roomId });
          socket.emit('join room result', { message: '참여 성공~', result: true, roomId })
          console.log(rooms, '-------------------------방 참여 완료 by name -----------------------------------');
          console.log(userSockets, '-------------------------방 참여 완료 by name -----------------------------------');
          if (room.drawings) {
            socket.emit('initializeCanvas', Array.from(room.drawings));
          }
        }

        // 들어온 적 있는 유저가 다시 들어왔을 때
        if (socketId && room.users.has(userId)) {
          socket.join(roomId);
          socket.emit('join room result', { message: '참여 성공~', result: true, roomId })
          console.log(rooms, '-------------------------방 참여 완료 -----------------------------------');
          if (room.drawings) {
            socket.emit('initializeCanvas', Array.from(room.drawings));
          }
        }
      } else {
        socket.to(roomId).emit('join room result', `방이 존재하지 않습ㄴ디ㅏ.`);
      }
    });

    // 방 나가기 
    socket.on('leave room', (data) => {
      console.log('------------------------------------서버에서 방 나갑ㄴ디ㅏ.');
      const { roomId, userId } = data;
      const socketId = userSockets.get(userId);
      const room = rooms.get(roomId);
      if (socketId && room) {
        console.log(room, '------------------------------나가려는 방');
        room.users.delete(userId);
        socket.leave(roomId);
        if (room.users.size === 0) {
          rooms.delete(roomId);
        }
        console.log(rooms, '유저가 방을 나갔습니다-----------------------------');
      }
    })

    // 메세지 보내기
    socket.on('send message', (data) => {
      console.log('보낸 메세지 = ', data);
      const room = rooms.get(data.roomId);
      console.log('------------------------------메세지 보내기-----------------------');
      if (room) {
        console.log('room exist, send message!!!');
        console.log(room, '--------------------보낸 방 정보');
        console.log(rooms, '--------------------전체 방 정보');
        io.to(data.roomId).emit('receive message', { ...data, date: new Date().getTime() })
      }
    });


    socket.on('draw', (data) => {
      console.log('--------------------그림 그리기');
      console.log(rooms);
      console.log(data, '--------------------그림 그리기 데이터');

      const room = rooms.get(data.roomId);
      if (room) {
        if (!room.drawings) {
          room.drawings = new Set();
        }
        room.drawings.add(data.pathData);
        
        socket.to(data.roomId).emit('drawPath', data);
      } else {
        console.log('Room not found:', data.roomId);
      }
    });
  });

};