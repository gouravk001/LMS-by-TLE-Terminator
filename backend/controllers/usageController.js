import User from "../models/userModel.js";

export const updateUsage = async (req, res) => {
  try {

    console.log("🟢 [USAGE] updateUsage API called");
    console.log("🟢 [USAGE] userId:", req.userId);
    console.log("🟢 [USAGE] body:", req.body);

    const userId = req.userId;

    // ensure minutes is a number
    const minutes = Number(req.body.minutes) || 0;

    console.log("🟢 [USAGE] minutes received:", minutes);

    const user = await User.findById(userId);

    if (!user) {
      console.log("🔴 [USAGE] user not found");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("🟢 [USAGE] user found:", user._id);

    // ensure fields exist
    if (!user.dailyUsage) user.dailyUsage = [];
    if (typeof user.continuousUsageMinutes !== "number") {
      user.continuousUsageMinutes = 0;
    }

    const today = new Date().toISOString().split("T")[0];

    console.log("🟢 [USAGE] today date:", today);

    // find today's usage
    let todayUsage = user.dailyUsage.find((d) => d.date === today);

    if (!todayUsage) {

      console.log("🟡 [USAGE] creating new usage entry");

      user.dailyUsage.push({
        date: today,
        minutesSpent: minutes,
      });

    } else {

      console.log("🟡 [USAGE] updating existing usage entry");

      todayUsage.minutesSpent += minutes;
    }

    // keep only last 30 days
    if (user.dailyUsage.length > 30) {
      user.dailyUsage = user.dailyUsage.slice(-30);
    }

    // update continuous usage
    user.continuousUsageMinutes += minutes;

    console.log("🟢 [USAGE] continuousUsageMinutes:", user.continuousUsageMinutes);

    await user.save();

    console.log("🟢 [USAGE] user saved to DB");

    const todayUsageUpdated = user.dailyUsage.find((d) => d.date === today);

    return res.json({
      success: true,
      continuousUsageMinutes: user.continuousUsageMinutes,
      todayMinutes: todayUsageUpdated?.minutesSpent || 0,
    });

  } catch (error) {
    console.error("🔴 [USAGE ERROR]", error);
    res.status(500).json({ message: "Usage update failed" });
  }
};

export const resetContinuousUsage = async (req, res) => {
  try {

    console.log("🟠 [USAGE] resetContinuousUsage called");
    console.log("🟠 [USAGE] userId:", req.userId);

    const userId = req.userId;

    await User.findByIdAndUpdate(userId, {
      continuousUsageMinutes: 0,
      currentSessionStart: null,
    });

    console.log("🟠 [USAGE] usage reset");

    res.json({ success: true });

  } catch (error) {
    console.error("🔴 [RESET ERROR]", error);
    res.status(500).json({ message: "Reset failed" });
  }
};