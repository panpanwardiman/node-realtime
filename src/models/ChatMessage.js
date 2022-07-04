import mongoose from "mongoose"
import { v4 as uuidv4 } from "uuid"

export const MESSAGE_TYPES = {
    TYPE_TEXT: "text"
}

const readByRecipientSchema  = new mongoose.Schema({
    _id: false,
    readByUserId: String,
    readAt: {
        type: Date,
        default: Date.now()
    }
}, {
    timestamps: false
})

const chatMessageSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => uuidv4().replace(/\-/g, "")
    },
    chatRoomId: String,
    message: mongoose.Schema.Types.Mixed,
    type: {
        type: String,
        default: () => MESSAGE_TYPES.TYPE_TEXT
    },
    postedByUser: String,
    readByRecipients: [readByRecipientSchema]
},{
    timestamps: true,
    collection: "chatmessages",
})

chatMessageSchema.statics.createPostInChatRoom = async function(
    chatRoomId, message, postedByUser
) {
    try {
        const post = await this.create({
            chatRoomId,
            message,
            postedByUser, 
            readByRecipients: { readByUserId: postedByUser }
        })

        const aggregate = await this.aggregate([
            { $match: { _id: post._id }},
            {
                $lookup: {
                    from: 'users',
                    localField: 'postedByUser',
                    foreignField: '_id',
                    as: 'postedByUser'
                }
            },
            { $unwind: '$postedByUser' },
            { 
                $lookup: {
                    from: 'chatrooms',
                    localField: 'chatRoomId',
                    foreignField: '_id',
                    as: 'chatRoomInfo'
                }
            },
            { $unwind: '$chatRoomInfo' },
            { $unwind: '$chatRoomInfo.userIds' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'chatRoomInfo.userIds',
                    foreignField: '_id',
                    as: 'chatRoomInfo.userProfile',
                    }
                },
            { $unwind: '$chatRoomInfo.userProfile' },
            {
                $group: {
                    _id: '$chatRoomInfo._id',
                    postId: { $last: '$_id' },
                    chatRoomId: { $last: '$charRoomInfo._id' },
                    message: { $last: '$message' },
                    type: { $last: '$type' },
                    postedByUser: { $last: '$readByReceipients' },
                    chatRoomInfo: { $addToSet: '$chatRoomInfo.userProfile' },
                    createdAt: { $last: '$createdAt' },
                    updatedAt: { $last: '$updatedAt' },
                }
            }
        ])
        return aggregate
    } catch (error) {
        throw error
    }
}

chatMessageSchema.statics.getConversationByRoomId = async function(chatRoomId, options = {}) {
    try {
        return this.aggregate([
            { $match: { chatRoomId }},
            { $sort: { created: -1 }},
            {
                $lookup: {
                    from: 'users',
                    localField: 'postedByUser',
                    foreignField: '_id',
                    as: 'postedByUser'
                }
            },
            { $unwind: "$postedByUser" },
            { $skip: options.page * options.limit },
            { $limit: options.limit },
            { $sort: { createdAt: 1 } },
        ])
    } catch (error) {
        throw error;
    }
}

chatMessageSchema.statics.markMessageRead = async function(chatRoomId, currentUserOnlineId) {
    try {
        return this.updateMany(
            {
                chatRoomId,
                'readByRecepients.readByUserId': { $ne: currentUserOnlineId }
            },
            {
                $addToSet: {
                    readByRecipients: { readByUserId: currentUserOnlineId }
                }
            },
            {
                multi: true
            }
        )
    } catch (error) {
        throw error;
    }
}

export default mongoose.model("ChatMessage", chatMessageSchema)