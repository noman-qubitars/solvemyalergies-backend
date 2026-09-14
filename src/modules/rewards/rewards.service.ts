import { getOrCreateUserReward, UserReward, findAllUserRewards } from "../../models/UserReward";
import { createRewardTransaction, findRewardTransactionsByUser } from "../../models/RewardTransaction";
import { getOrCreateRewardSettings } from "../../models/RewardSettings";
import { findUserByEmail, findUserById, findAllUsers } from "../../models/User";
import { sendReferralEmail } from "../../services/mailService";
import { WEEKLY_STAR_VALUES, TOTAL_WEEKS } from "./rewards.constants";

// Called from videoWatchTracking after a video is newly marked completed and the caller has
// already confirmed every video for this week is now done. Idempotent: the atomic update only
// succeeds the first time a week is completed, so concurrent/duplicate calls are a no-op.
export const awardWeeklyStars = async (userId: string, weekNumber: number): Promise<void> => {
  const starsToAward = WEEKLY_STAR_VALUES[weekNumber];
  if (!starsToAward) {
    return;
  }

  await getOrCreateUserReward(userId);

  const updated = await UserReward.findOneAndUpdate(
    { userId, completedWeeks: { $ne: weekNumber } },
    {
      $inc: { currentBalance: starsToAward, totalEarned: starsToAward },
      $push: { completedWeeks: weekNumber },
    },
    { new: true }
  );

  if (!updated) {
    return; // Already awarded for this week
  }

  await createRewardTransaction({
    userId,
    event: "week_complete",
    starsEarned: starsToAward,
    balanceAfter: updated.currentBalance,
    weekNumber,
  });
};

export const getUserRewardBalance = async (userId: string) => {
  const userReward = await getOrCreateUserReward(userId);
  return {
    currentBalance: userReward.currentBalance,
    totalEarned: userReward.totalEarned,
    totalRedeemed: userReward.totalRedeemed,
  };
};

export const getUserAchievements = async (userId: string) => {
  const userReward = await getOrCreateUserReward(userId);
  const achievements = [];

  for (let week = 1; week <= TOTAL_WEEKS; week++) {
    achievements.push({
      weekNumber: week,
      stars: WEEKLY_STAR_VALUES[week],
      completed: userReward.completedWeeks.includes(week),
    });
  }

  return achievements;
};

export const sendReferral = async (userId: string, recipientEmail: string, stars: number) => {
  const sender = await findUserById(userId);
  if (!sender) {
    throw new Error("Sender account not found");
  }

  const userReward = await getOrCreateUserReward(userId);

  await sendReferralEmail(recipientEmail, sender.name || sender.email, stars);

  // Referral stars are a promotional bonus for the friend — they do NOT reduce the sender's
  // own balance, so we only log the event for history/audit and bump the referred total.
  await UserReward.updateOne({ userId }, { $inc: { totalReferred: stars } });

  await createRewardTransaction({
    userId,
    event: "referral_sent",
    balanceAfter: userReward.currentBalance,
    relatedEmail: recipientEmail,
  });

  return { success: true, message: "Referral sent successfully" };
};

export const transferStars = async (userId: string, recipientEmail: string, stars: number) => {
  const recipient = await findUserByEmail(recipientEmail);
  if (!recipient) {
    throw new Error("Recipient not found. They must have an account to receive transferred stars");
  }

  const recipientId = recipient._id.toString();
  if (recipientId === userId) {
    throw new Error("You cannot transfer stars to yourself");
  }

  const senderReward = await getOrCreateUserReward(userId);
  if (senderReward.currentBalance < stars) {
    throw new Error("Insufficient stars balance");
  }

  const updatedSender = await UserReward.findOneAndUpdate(
    { userId, currentBalance: { $gte: stars } },
    { $inc: { currentBalance: -stars, totalTransferred: stars } },
    { new: true }
  );

  if (!updatedSender) {
    throw new Error("Insufficient stars balance");
  }

  await createRewardTransaction({
    userId,
    event: "transfer_sent",
    starsTransferred: stars,
    balanceAfter: updatedSender.currentBalance,
    relatedEmail: recipientEmail,
    relatedUserId: recipientId,
  });

  await getOrCreateUserReward(recipientId);
  const updatedRecipient = await UserReward.findOneAndUpdate(
    { userId: recipientId },
    { $inc: { currentBalance: stars, totalEarned: stars } },
    { new: true }
  );

  await createRewardTransaction({
    userId: recipientId,
    event: "transfer_received",
    starsEarned: stars,
    balanceAfter: updatedRecipient!.currentBalance,
    relatedEmail: recipient.email,
    relatedUserId: userId,
  });

  return { success: true, message: "Stars transferred successfully", currentBalance: updatedSender.currentBalance };
};

export const redeemStars = async (userId: string, stars: number) => {
  const settings = await getOrCreateRewardSettings();

  if (stars < settings.minimumRedemption) {
    throw new Error(`You need at least ${settings.minimumRedemption} stars to redeem`);
  }

  const userReward = await getOrCreateUserReward(userId);
  if (userReward.currentBalance < stars) {
    throw new Error("Insufficient stars balance");
  }

  const updated = await UserReward.findOneAndUpdate(
    { userId, currentBalance: { $gte: stars } },
    { $inc: { currentBalance: -stars, totalRedeemed: stars } },
    { new: true }
  );

  if (!updated) {
    throw new Error("Insufficient stars balance");
  }

  const dollarValue = Number((stars * settings.rewardValuePerStar).toFixed(2));

  await createRewardTransaction({
    userId,
    event: "redeemed",
    starsRedeemed: stars,
    balanceAfter: updated.currentBalance,
  });

  return {
    success: true,
    message: "Stars redeemed successfully",
    starsRedeemed: stars,
    dollarValue,
    currentBalance: updated.currentBalance,
  };
};

export const getAdminRewardsList = async (search: string | undefined, page: number, limit: number) => {
  const allUsers = await findAllUsers();
  const userMap = new Map(allUsers.map((u: any) => [u._id.toString(), u]));

  let userIds: string[] | undefined;
  if (search) {
    const searchLower = search.toLowerCase();
    userIds = allUsers
      .filter(
        (u: any) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower) ||
          u._id.toString().includes(search)
      )
      .map((u: any) => u._id.toString());
  }

  const { rewards, total } = await findAllUserRewards(userIds, page, limit);

  const data = rewards.map((reward: any) => {
    const user = userMap.get(reward.userId);
    return {
      userId: reward.userId,
      userName: user?.name || "Unknown",
      starsEarned: reward.totalEarned,
      starsRedeemed: reward.totalRedeemed,
      starsShared: reward.totalTransferred,
      currentBalance: reward.currentBalance,
    };
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getAdminUserRewardDetail = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const userReward = await getOrCreateUserReward(userId);
  const transactions = await findRewardTransactionsByUser(userId);

  return {
    userId,
    fullName: user.name,
    email: user.email,
    joinedOn: user.createdAt,
    currentBalance: userReward.currentBalance,
    totalEarned: userReward.totalEarned,
    totalRedeemed: userReward.totalRedeemed,
    totalTransferred: userReward.totalTransferred,
    starBreakdown: transactions,
  };
};

export const getRewardSettings = async () => {
  const settings = await getOrCreateRewardSettings();
  return {
    rewardValuePerStar: settings.rewardValuePerStar,
    minimumRedemption: settings.minimumRedemption,
    expireEnabled: settings.expireEnabled,
    expireMonths: settings.expireMonths,
    fraudPreventionEnabled: settings.fraudPreventionEnabled,
  };
};

export const updateRewardSettings = async (data: {
  rewardValuePerStar?: number;
  minimumRedemption?: number;
  expireEnabled?: boolean;
  expireMonths?: number;
  fraudPreventionEnabled?: boolean;
}) => {
  const settings = await getOrCreateRewardSettings();
  Object.assign(settings, data);
  await settings.save();

  return {
    rewardValuePerStar: settings.rewardValuePerStar,
    minimumRedemption: settings.minimumRedemption,
    expireEnabled: settings.expireEnabled,
    expireMonths: settings.expireMonths,
    fraudPreventionEnabled: settings.fraudPreventionEnabled,
  };
};
