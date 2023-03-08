// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for threads
const Thread = require('../models/thread')
// pull in Mongoose model for message
const Message = require('../models/user')

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

// SHOW
// GET /threads/5a7db6c74d55bc51bdf39793
router.get('/threads/:id', requireToken, (req, res, next) => {
	// req.params.id will be set based on the `:id` in the route
	Thread.findById(req.params.id)
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

//! THIS DOES NOT WORK RIGHT NOW
// UPDATE -> reply to a thread
// PATCH /threads/5a7db6c74d55bc51bdf39793
router.patch('/threads/reply/:id', requireToken, removeBlanks, (req, res, next) => {
	// assign owner of new message as current user
	req.body.message.owner = req.user.id
	// console.log('req.body.message', req.body.message)
	// console.log('req.user', req.user)
	// // create a new message
	// Message.create(req.body.message)
	// 	.then((message) => {
	// 		console.log('created message', message)
	// 		// find a thread by its id from req.params
			Thread.findById(req.params.id)
				.then((thread) => {
					console.log('found thread', thread)
					// push that message onto an existing thread's replies array
					thread.replies.push(req.body.message)
					return thread.save()
				})
				.then(() => res.sendStatus(204))
				.catch(next)
		// })
		// .catch(next)
	
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

