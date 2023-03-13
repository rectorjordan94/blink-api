const mongoose = require('mongoose')
const User = require('./user')

const messageSchema = new mongoose.Schema(
	{
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		inThread: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Thread'
		}
	},
	{
		timestamps: true,
	}
)

messageSchema.virtual('author', {
	ref: 'User',
	localField: 'owner',
	foreignField: '_id'
})

module.exports = mongoose.model('Message', messageSchema)
