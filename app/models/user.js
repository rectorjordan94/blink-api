const mongoose = require('mongoose')
const Profile = require('./profile')

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		hashedPassword: {
			type: String,
			required: true,
		},
		profile: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Profile'
		},
		channels: [{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Channel'
		}],
		token: String,
	},
	{
		timestamps: true,
		toObject: {
			// remove `hashedPassword` field when we call `.toObject`
			transform: (_doc, user) => {
				delete user.hashedPassword
				return user
			},
			virtuals: true
		},
		toJSON: { virtuals: true }
	}
)

// userSchema.virtual('username', {
// 	ref: 'Profile',
// 	localField: 'profile',
// 	foreignField: '_id',
// 	justOne: true
// })

module.exports = mongoose.model('User', userSchema)
