// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for threads
const Thread = require('../models/thread')
// pull in Mongoose model for message
const Message = require('../models/message')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { thread: { title: '', text: 'foo' } } -> { thread: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

const { ObjectId } = require('mongodb')

// INDEX
// GET /threads
router.get('/threads', requireToken, (req, res, next) => {
	Thread.find()
		.then((threads) => {
			// `threads` will be an array of Mongoose documents
			// we want to convert each one to a POJO, so we use `.map` to
			// apply `.toObject` to each one
			return threads.map((thread) => thread.toObject())
		})
		// respond with status 200 and JSON of the threads
		.then((threads) => res.status(200).json({ threads: threads }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

router.get('/threads/channel', requireToken, (req, res, next) => {
	// console.log('req.query.threads: ', req.query.threads)
	let threadString = req.query.threads
	const objectIdArray = []
	const threadArray = threadString.split(',')
	threadArray.forEach(item => objectIdArray.push(ObjectId(item)))
	// console.log(objectIdArray)
	// const _id = ObjectId(objectIdArray)
	// console.log('_id: ', _id)
	// Thread.findById(_id)
	Thread.find({ _id: { $in: objectIdArray } })
		.populate('firstMessage')
		.populate('owner')
		.then(handle404)
		.then((threads) => {
			// console.log('threads in .then: ', threads)
			return threads
		})
		.then((threads) => res.status(200).json({ threads: threads }))
		.catch(next)
})

// SHOW
// GET /threads/5a7db6c74d55bc51bdf39793
router.get('/threads/:id', requireToken, (req, res, next) => {
	// req.params.id will be set based on the `:id` in the route
	Thread.findById(req.params.id)
		// .populate('firstMessage')
		.then(handle404)
		// if `findById` is succesful, respond with 200 and "thread" JSON
		.then((thread) => res.status(200).json({ thread: thread.toObject() }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// CREATE
// POST /threads
router.post('/threads', requireToken, (req, res, next) => {
	// set author of new thread to be current user
	req.body.thread.owner = req.user.id
	console.log('req.body in create thread: ', req.body)
	Thread.create(req.body.thread)
		// respond to succesful `create` with status 201 and JSON of new "thread"
		.then((thread) => {
			res.status(201).json({ thread: thread.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error thread and the `res` object so that it
		// can send an error thread back to the client
		.catch(next)
})

// UPDATE
// PATCH /threads/5a7db6c74d55bc51bdf39793
router.patch('/threads/:id', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	// delete req.body.thread.owner
	Thread.findById(req.params.id)
		.then(handle404)
		.then((thread) => {
			// pass the `req` object and the Mongoose record to `requireOwnership`
			// it will throw an error if the current user isn't the owner
			requireOwnership(req, thread)
			// pass the result of Mongoose's `.update` to the next `.then`
			return thread.updateOne(req.body.thread)
		})
		// if that succeeded, return 204 and no JSON
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// UPDATE -> reply to a thread
// PATCH /threads/6408a38f9d75ce6098f0d5c8/6408e36c518516dcde8c40cc
router.patch('/threads/:threadId/:messageId', requireToken, removeBlanks, (req, res, next) => {
	const { threadId, messageId } = req.params
	console.log('messageId: ', messageId)
	Thread.findById(threadId)
		.then(handle404)
		.then((thread) => {
			console.log('thread', thread)
			//! ADD IF STATEMENT TO CHECK IF MESSAGE ALREADY EXISTS IN THE REPLIES ARRAY
			// if it doesn't, find the user by their id
			Message.findById(messageId)
				.then(handle404)
				.then(message => {
					console.log('message: ', message)
					console.log('thread.replies: ', thread.replies)
					// push the user onto the channel's members array
					thread.replies.push(message)
					return thread.save()
				})
				.catch(next)
		})
		.then(() => res.sendStatus(204))
		.catch(next)
})

// DESTROY
// DELETE /threads/5a7db6c74d55bc51bdf39793
router.delete('/threads/:id', requireToken, (req, res, next) => {
	Thread.findById(req.params.id)
		.then(handle404)
		.then((thread) => {
			// throw an error if current user doesn't own `thread`
			requireOwnership(req, thread)
			// delete the thread ONLY IF the above didn't throw
			thread.deleteOne()
		})
		// send back 204 and no content if the deletion succeeded
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

module.exports = router

