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
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			//! add this back in after deleting all threads w/out owners from the database
			// required: true
		}
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Thread', threadSchema)
