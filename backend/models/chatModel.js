const mongoose = require("mongoose");

const chatroomSchema = new mongoose.Schema(
  {
    roomMembers: Array,
    roomPinnedBy: Array,
  },
  {
    timestamps: true,
  }
);

const chatRoomModel = mongoose.model("chatrooms", chatroomSchema);

module.exports = chatRoomModel;
