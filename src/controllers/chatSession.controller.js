import ChatSession from "../models/chatSession.model.js";

// ✅ CREATE NEW CHAT
export const createChat = async (req, res) => {
  const { userId } = req;

  const chat = await ChatSession.create({
    userId,
    title: "New Chat",
  });

  res.json(chat);
};

// ✅ GET ALL CHATS
export const getChats = async (req, res) => {
  const chats = await ChatSession.find({ userId: req.userId })
    .sort({ updatedAt: -1 });

  res.json(chats);
};

// ✅ UPDATE TITLE
export const updateChat = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  const chat = await ChatSession.findByIdAndUpdate(
    id,
    { title },
    { new: true }
  );

  res.json(chat);
};

// ✅ DELETE CHAT
export const deleteChat = async (req, res) => {
  const { id } = req.params;

  await ChatSession.findByIdAndDelete(id);

  res.json({ success: true });
};