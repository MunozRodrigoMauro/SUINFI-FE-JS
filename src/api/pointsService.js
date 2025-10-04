// Authenticated endpoints for Points
import axiosUser from "./axiosUser";

export const getMyPoints = async () => {
  const { data } = await axiosUser.get("/points/me");
  return data; // { balance, nextReward: { cost, missing } }
};

export const getMyPointsHistory = async ({ limit = 50, cursor = null } = {}) => {
  const params = { limit };
  if (cursor) params.cursor = cursor;
  const { data } = await axiosUser.get("/points/me/history", { params });
  return data; // { items, nextCursor }
};
