import axiosUser from "./axiosUser";

export const listRewards = async () => {
  const { data } = await axiosUser.get("/rewards");
  return data;
};

export const redeemReward = async (rewardId) => {
  const { data } = await axiosUser.post(`/rewards/${rewardId}/redeem`);
  return data; // { redemptionId, code, status, rewardId }
};
