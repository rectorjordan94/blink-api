const mongoose = require('mongoose')

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
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Thread', threadSchema)
