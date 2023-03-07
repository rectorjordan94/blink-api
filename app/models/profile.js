const mongoose = require('mongoose')

const profileSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
		},
		fullName: {
			type: String,
			required: true,
		},
		location: {
			type: String,
			required: true,
		},
		pronouns: {
			type: String,
			required: true,
		},
		userRef: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Example', exampleSchema)
