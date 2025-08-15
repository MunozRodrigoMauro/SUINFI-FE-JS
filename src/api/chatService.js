import axiosUser from "./axiosUser";

export const getMyChats = async () => {
  const { data } = await axiosUser.get("/chats/my");
  return data;
};

export const sendMessage = async ({ chatId, message }) => {
  const { data } = await axiosUser.post(`/chats/${chatId}/messages`, { message });
  return data;
};
