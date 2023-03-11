const mongoose = require('mongoose')

const profileSchema = new mongoose.Schema(
	{
		username: {
			type: String,
		},
		fullName: {
			type: String,
		},
		location: {
			type: String,
		},
		pronouns: {
			type: String,
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Profile', profileSchema)
