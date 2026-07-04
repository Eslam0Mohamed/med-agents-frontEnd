export const getSubscriptionMessage = (subscription) => {
      if (!subscription) return null;

  if (subscription.status === "expired") {
    return {
      title: "Subscription Expired",
      message:
        "Your subscription has expired. Renew now to regain access to all features.",
      bg: "bg-red-50",
      border: "border-red-500",
      titleColor: "text-red-600",
    };
  }

  if (subscription.daysLeft <= 3) {
    return {
      title: "Subscription Expiring Soon",
      message:
        "Your subscription will expire soon. Please contact the administrator.",
      bg: "bg-red-50",
      border: "border-red-500",
      titleColor: "text-red-600",
    };
  }

  if (subscription.status === "trial") {
    return {
      title: "Free Trial",
      message:
        "You're currently using the free trial. Upgrade before it expires to continue using all features.",
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      titleColor: "text-yellow-700",
    };
  }

  return {
    title: "Premium Active",
    message:
      "Your subscription is active. Enjoy all premium features.",
    bg: "bg-green-50",
    border: "border-green-500",
    titleColor: "text-green-700",
  };
};