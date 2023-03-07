const mongoose = require('mongoose')

const channelSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		}, 
		description: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			required: true,
			enum: ['DM', 'GROUP'],
			default: 'GROUP'
		},
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		members: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		}],
		threads: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Thread'
		}]
	},
	{
		timestamps: true,
	}
)

module.exports = mongoose.model('Example', channelSchema)
