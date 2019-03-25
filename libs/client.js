const Socket = require('socket.io-client')

module.exports = url => {
  const socket = Socket.connect(url, {
    transports: ['websocket']
  });

  socket.on('connect', function() {
    console.log('CONNECTED')
  })

  socket.on('disconnect', function() {
    console.log('CONNECTION LOST')
  })

  socket.on('error', console.error)

  return socket
}
