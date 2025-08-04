import axiosClient from "./axiosClient";

export const getMyChats = async () => {
  const { data } = await axiosClient.get("/chats/my");
  return data;
};

export const sendMessage = async ({ chatId, message }) => {
  const { data } = await axiosClient.post(`/chats/${chatId}/messages`, { message });
  return data;
};
