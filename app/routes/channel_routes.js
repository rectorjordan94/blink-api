// Express docs: http://expressjs.com/en/api.html
const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for channels
const Channel = require('../models/channel')
// pull in Mongoose model for user
const User = require('../models/user')
// pull in Mongoose model for threads
const Thread = require('../models/thread')
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
	// populate user emails in channels for testing purposes, 
	//! remove this later CAN MAYBE POPULATE MEMBERS TO GRAB USERNAME??
		.populate('members')
		// .populate('threads')
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

router.get('/channels/mine', requireToken, (req, res, next) => {
	const userId = req.user.id
	Channel.find({ $or: [{ owner: userId}, { members: { $in: userId } }]})
		.then((channels) => {
			console.log('my channels: ', channels)
			return channels
		})
		.then((channels) => res.status(200).json({ channels: channels }))
		.catch(next)
})


// SHOW
// GET /channels/5a7db6c74d55bc51bdf39793
router.get('/channels/:id', requireToken, (req, res, next) => {
	// req.params.id will be set based on the `:id` in the route
	Channel.findById(req.params.id)
		.populate('members')
		// .populate('threads')
		.then(handle404)
		// if `findById` is succesful, respond with 200 and "channel" JSON
		.then((channel) => res.status(200).json({ channel: channel.toObject() }))
		// if an error occurs, pass it to the handler
		.catch(next)
})


//! CREATE CHANNEL -> CREATE A MESSAGE -> CREATE A THREAD USING MESSAGE AS THE FIRSTMESSAGE
router.post('/channels', requireToken, (req, res, next) => {
	// set owner of new example to be current user
	req.body.channel.owner = req.user.id
	// console.log('req.body.channel', req.body.channel)

	// create first initial message needed to create a thread
	const message = {
		content: `Welcome to ${req.body.channel.name} channel. Start chatting!`,
		owner: req.user.id
	}
	// create a channel with the req.body
	Channel.create(req.body.channel)
		.then((channel) => {
			// create a message with the name of the channel from req.body.channel.name
			Message.create(message)
				.then((message) => {
					// create initial thread for channel and set the message that was just created as the firstMessage
					const thread = {
						firstMessage: message.id,
						owner: req.user.id
					}
					Thread.create(thread)
						.then((thread) => {
							// console.log('THREAD: ', thread)

							// grab the newly created channel from the database using its id
							Channel.findById(channel.id)
								.then((channel) => {
									// push the new thread onto the channel
									channel.threads.push(thread)
									// save the channel 
									return channel.save()
								})
								.then((channel) => {
									// respond to succesful `create` with status 201 and JSON of new "channel"
									res.status(201).json({ channel: channel.toObject() })
								})
								.catch(next)
						})
						.catch(next)
				})
				.catch(next)
		})
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

// UPDATE - Add thread to channel
// PATCH /channels/6407a49fa65fefda5bf50214/6407a5be5613cc597f002aaa
router.patch('/channels/thread/:channelId/:threadId/', requireToken, removeBlanks, (req, res, next) => {
	// grab the id's from req.params
	const { channelId, threadId } = req.params

	// find the channel by its id
	Channel.findById(channelId)
		.then(handle404)
		.then((channel) => {
			// requireOwnership(req, channel)
				if (!channel.threads.includes(threadId)) {
					// if it doesn't, find the thread by its id
					Thread.findById(threadId)
						.then(thread => {
							requireOwnership(req, thread)
							// push the thread onto the channel's threads array
							channel.threads.push(thread)
							return channel.save()
						})
						.catch(next)
				}
		})
		.then(() => res.sendStatus(204))
		// if an error occurs, pass to handler
		.catch(next)
})

// UPDATE - Add/remove member to/from channel
// PATCH /channels/6407a49fa65fefda5bf50214/6407a5be5613cc597f002aaa
router.patch('/channels/:channelId/:addOrRemove/:userId', requireToken, removeBlanks, (req, res, next) => {
	// grab the id's from req.params
	const { channelId, userId, addOrRemove } = req.params

	// find the channel by its id
	Channel.findById(channelId)
		.then(handle404)
		.then((channel) => {
			requireOwnership(req, channel)
			// check to make sure that the channel's member ref array doesn't already include the user you're adding and the addOrRemove param is equal to 'add'
			if (addOrRemove === 'add') {
				if (!channel.members.includes(userId)) {
					// if it doesn't, find the user by their id
					User.findById(userId)
						.then(user => {
							// push the user onto the channel's members array
							channel.members.push(user)
							return channel.save()
						})
						.catch(next)
				} 
				// if the channel's member ref array includes the user in it already & the addOrRemove keyword is equal to 'remove'
			} else if (addOrRemove === 'remove') {
				if (channel.members.includes(userId)) {
					User.findById(userId)
					.then(user => {
						// grab the index of the user in the channel's members array
						let index = channel.members.indexOf(user)
						// splice the members array at that index and remove it
						channel.members.splice(index, 1)
						return channel.save()
					})
					.catch(next)
				} 
			}
		})
		.then(() => res.sendStatus(204))
		// if an error occurs, pass to handler
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

// a.a id 6407a44df5bc2b625cf762c5
// t.t id 6407a43315ac3ba75ed2da72
// sei fruitcakes channel id 6407a49fa65fefda5bf50214