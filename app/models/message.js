const mongoose = require('mongoose')

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
		}
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Message', messageSchema)
