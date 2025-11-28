const mongoose =  require('mongoose');

const messageSchema = new mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    attachments: [{ url: String, filename: String, mime: String}],
    reactions: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, emoji: String }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    editedAt: { type: Date }
});

module.exports = mongoose.model('Message', messageSchema);