// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for messages
const Message = require('../models/message')
// pull in Mongoose model for user
const Thread = require('../models/thread')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { message: { title: '', text: 'foo' } } -> { message: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// router.delete('/messages/delete', (req, res, next) => {
// 	Message.find()
// 		.then((messages) => {
// 			messages.forEach(message => message.deleteOne())
// 		})
// 		.then(() => res.sendStatus(204))
// 		// if an error occurs, pass it to the handler
// 		.catch(next)
// })

// INDEX
// GET /messages
router.get('/messages', requireToken, (req, res, next) => {
	Message.find()
		.then((messages) => {
			// `messages` will be an array of Mongoose documents
			// we want to convert each one to a POJO, so we use `.map` to
			// apply `.toObject` to each one
			return messages.map((message) => message.toObject())
		})
		// respond with status 200 and JSON of the messages
		.then((messages) => res.status(200).json({ messages: messages }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

router.post('/messages/reply/:threadId', requireToken,  (req, res, next) => {
	req.body.message.owner = req.user.id
	const { threadId } = req.params
	req.body.message.inThread = threadId
	console.log('req.body.message: ', req.body.message)
	console.log('threadId: ', threadId)
	Message.create(req.body.message)
		.then((message) => {
			Thread.findById(threadId)
				.then(handle404)
				.then((thread) => {
					// message.inThread = threadId
					thread.replies.push(message)
					return thread.save()
				})
				.then(() => res.sendStatus(204))
				.catch(next)
		})
		.catch(next)
})


// SHOW
// GET /messages/5a7db6c74d55bc51bdf39793
router.get('/messages/:id', requireToken, (req, res, next) => {
	// req.params.id will be set based on the `:id` in the route
	Message.findById(req.params.id)
		.then(handle404)
		// if `findById` is succesful, respond with 200 and "message" JSON
		.then((message) => res.status(200).json({ message: message.toObject() }))
		// if an error occurs, pass it to the handler
		.catch(next)
})


//! NEED TO RETHINK MESSAGES/THREADS MODELS AND HOW TO CREATE A NEW MESSAGE AND ALSO AN INSTANCE OF A NEW THREAD AT THE SAME TIME
//* OR -----------------
//? FIGURE OUT HOW TO PASS APPROPRIATE REQ.BODY TO CREATE A THREAD WITH THE REQ.BODY NEEDED TO CREATE A MESSAGE
// CREATE
// POST /message
router.post('/messages', requireToken, (req, res, next) => {
	// set author of new message to be current user
	req.body.message.owner = req.user.id

	Message.create(req.body.message)
		.then((message) => {
			// console.log(message)
			res.status(201).json({ message: message.toObject()})
		})
		.catch(next)
})



// UPDATE
// PATCH /messages/5a7db6c74d55bc51bdf39793
router.patch('/messages/:id', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	// delete req.body.message.owner
	Message.findById(req.params.id)
		.then(handle404)
		.then((message) => {
			// pass the `req` object and the Mongoose record to `requireOwnership`
			// it will throw an error if the current user isn't the owner
			requireOwnership(req, message)
			// pass the result of Mongoose's `.update` to the next `.then`
			return message.updateOne(req.body.message)
		})
		// if that succeeded, return 204 and no JSON
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// DESTROY
// DELETE /messages/5a7db6c74d55bc51bdf39793
router.delete('/messages/:id', requireToken, (req, res, next) => {
	Message.findById(req.params.id)
		.then(handle404)
		.then((message) => {
			// throw an error if current user doesn't own `message`
			requireOwnership(req, message)
			// delete the message ONLY IF the above didn't throw
			message.deleteOne()
		})
		// send back 204 and no content if the deletion succeeded
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

module.exports = router

