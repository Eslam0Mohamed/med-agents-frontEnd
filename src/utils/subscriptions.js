export const getSubscriptionMessage = (subscription) => {
  if (!subscription) return null;

  if (subscription.status === "expired") {
    return {
      titleKey: "subscriptionsPage.status.expiredTitle",
      messageKey: "subscriptionsPage.status.expiredMessage",
      bg: "bg-red-50",
      border: "border-red-500",
      titleColor: "text-red-600",
    };
  }

  if (subscription.daysLeft <= 3) {
    return {
      titleKey: "subscriptionsPage.status.expiringSoonTitle",
      messageKey: "subscriptionsPage.status.expiringSoonMessage",
      bg: "bg-red-50",
      border: "border-red-500",
      titleColor: "text-red-600",
    };
  }

  if (subscription.status === "trial") {
    return {
      titleKey: "subscriptionsPage.status.trialTitle",
      messageKey: "subscriptionsPage.status.trialMessage",
      bg: "bg-yellow-50",
      border: "border-yellow-500",
      titleColor: "text-yellow-700",
    };
  }

  return {
    titleKey: "subscriptionsPage.status.activeTitle",
    messageKey: "subscriptionsPage.status.activeMessage",
    bg: "bg-green-50",
    border: "border-green-500",
    titleColor: "text-green-700",
  };
};