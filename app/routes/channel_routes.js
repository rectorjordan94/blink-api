// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for channels
const Channel = require('../models/channel')
// pull in Mongoose model for user
const User = require('../models/user')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { channel: { title: '', text: 'foo' } } -> { channel: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// INDEX
// GET /channels
router.get('/channels', requireToken, (req, res, next) => {
	Channel.find()
		.then((channels) => {
			// `channels` will be an array of Mongoose documents
			// we want to convert each one to a POJO, so we use `.map` to
			// apply `.toObject` to each one
			return channels.map((channel) => channel.toObject())
		})
		// respond with status 200 and JSON of the channels
		.then((channels) => res.status(200).json({ channels: channels }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// SHOW
// GET /channels/5a7db6c74d55bc51bdf39793
router.get('/channels/:id', requireToken, (req, res, next) => {
	// req.params.id will be set based on the `:id` in the route
	Channel.findById(req.params.id)
		.then(handle404)
		// if `findById` is succesful, respond with 200 and "channel" JSON
		.then((channel) => res.status(200).json({ channel: channel.toObject() }))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// CREATE
// POST /channels
router.post('/channels', requireToken, (req, res, next) => {
	// set owner of new example to be current user
	req.body.channel.owner = req.user.id

	Channel.create(req.body.channel)
		// respond to succesful `create` with status 201 and JSON of new "channel"
		.then((channel) => {
			res.status(201).json({ channel: channel.toObject() })
		})
		// if an error occurs, pass it off to our error handler
		// the error handler needs the error message and the `res` object so that it
		// can send an error message back to the client
		.catch(next)
})

// UPDATE
// PATCH /channels/5a7db6c74d55bc51bdf39793
router.patch('/channels/:id', requireToken, removeBlanks, (req, res, next) => {
	// if the client attempts to change the `owner` property by including a new
	// owner, prevent that by deleting that key/value pair
	delete req.body.channel.owner

	Channel.findById(req.params.id)
		.then(handle404)
		.then((channel) => {
			// pass the `req` object and the Mongoose record to `requireOwnership`
			// it will throw an error if the current user isn't the owner
			requireOwnership(req, channel)

			// pass the result of Mongoose's `.update` to the next `.then`
			return channel.updateOne(req.body.channel)
		})
		// if that succeeded, return 204 and no JSON
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

// DESTROY
// DELETE /channels/5a7db6c74d55bc51bdf39793
router.delete('/channels/:id', requireToken, (req, res, next) => {
	Channel.findById(req.params.id)
		.then(handle404)
		.then((channel) => {
			// throw an error if current user doesn't own `channel`
			requireOwnership(req, channel)
			// delete the channel ONLY IF the above didn't throw
			channel.deleteOne()
		})
		// send back 204 and no content if the deletion succeeded
		.then(() => res.sendStatus(204))
		// if an error occurs, pass it to the handler
		.catch(next)
})

module.exports = router
