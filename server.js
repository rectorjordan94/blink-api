// require necessary NPM packages
const express = require('express')
// socket io dependencies
const { createServer } = require('http')
const { Server } = require('socket.io')

const mongoose = require('mongoose')
const cors = require('cors')

// require route files
const profileRoutes = require('./app/routes/profile_routes')
const channelRoutes = require('./app/routes/channel_routes')
const messageRoutes = require('./app/routes/message_routes')
const threadRoutes = require('./app/routes/thread_routes')
const userRoutes = require('./app/routes/user_routes')

// require middleware
const errorHandler = require('./lib/error_handler')
const replaceToken = require('./lib/replace_token')
const requestLogger = require('./lib/request_logger')

// require database configuration logic
// `db` will be the actual Mongo URI as a string
const db = require('./config/db')

// require configured passport authentication middleware
const auth = require('./lib/auth')

// define server and client ports
// used for cors and local port declaration
const serverDevPort = 8000
const clientDevPort = 3000

// establish database connection
// use new version of URL parser
// use createIndex instead of deprecated ensureIndex
mongoose.connect(db, {
	useNewUrlParser: true,
})

// instantiate express application object
const app = express()

// const httpServer = createServer(app)
// const io = new Server(httpServer)

// set CORS headers on response from this API using the `cors` NPM package
// `CLIENT_ORIGIN` is an environment variable that will be set on Heroku
app.use(
	cors({
		origin: process.env.CLIENT_ORIGIN || `http://localhost:${clientDevPort}`,
	})
)

// define port for API to run on
// adding PORT= to your env file will be necessary for deployment
const port = process.env.PORT || serverDevPort

// this middleware makes it so the client can use the Rails convention
// of `Authorization: Token token=<token>` OR the Express convention of
// `Authorization: Bearer <token>`
app.use(replaceToken)

// register passport authentication middleware
app.use(auth)

// add `express.json` middleware which will parse JSON requests into
// JS objects before they reach the route files.
// The method `.use` sets up middleware for the Express application
app.use(express.json())
// this parses requests sent by `$.ajax`, which use a different content type
app.use(express.urlencoded({ extended: true }))

// log each request as it comes in for debugging
app.use(requestLogger)

// register route files
app.use(profileRoutes)
app.use(channelRoutes)
app.use(messageRoutes)
app.use(threadRoutes)
app.use(userRoutes)

// register error handling middleware
// note that this comes after the route middlewares, because it needs to be
// passed any error messages from them
app.use(errorHandler)

// io.on('connection', (socket) => {
// 	console.log('connected')
// 	console.log('socket: ', socket)
// 	socket.emit('message', () => {
// 		console.log('message')
// 	})
// })

const httpServer = createServer(app)
const io = new Server(httpServer, {
	cors: {
		origin: process.env.CLIENT_ORIGIN || `http://localhost:${clientDevPort}`,
	}
})

io.on('connection', (socket) => {
	console.log(socket.id)
	socket.on('resetThreads', (resetThreads) => {
		console.log(resetThreads)
		socket.broadcast.emit('triggerRefresh')
	})

	socket.on('resetReplies', (resetReplies) => {
		console.log(resetReplies)
		socket.broadcast.emit('triggerRepliesRefresh')
	})

	socket.on('refreshMembers', () => {
		console.log('refresh members ran *********************************')
		socket.broadcast.emit('triggerMembersRefresh')
	})

	socket.on('disconnect', () => {
		console.log('user disconnected, socket.id: ', socket.id)
	})
})



// run API on designated port (4741 in this case)
//? changed from app to httpServer per the socket.io documentation
httpServer.listen(port, () => {
	console.log('listening on port ' + port)
})

// needed for testing
module.exports = app
