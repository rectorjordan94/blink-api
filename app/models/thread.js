const mongoose = require('mongoose')
const Message = require('./message')
const Profile = require('./profile')

const threadSchema = new mongoose.Schema(
	{
		firstMessage: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Message',
			required: true,
		},
		replies: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Message'
		}],
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			//! add this back in after deleting all threads w/out owners from the database
			// required: true
		}
	},
	{
		timestamps: true,
		toObject: { virtuals: true },
		toJSON: { virtuals: true }
	}
)

threadSchema.virtual('author', {
	ref: 'Profile',
	localField: 'owner',
	foreignField: 'owner',
	justOne: true
})

threadSchema.virtual('responses', {
	ref: 'Message',
	localField: 'replies',
	foreignField: 'inThread',
	justOne: true
})


module.exports = mongoose.model('Thread', threadSchema)
