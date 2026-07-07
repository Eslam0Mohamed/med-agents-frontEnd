import React from 'react'
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMySubscription } from "../../api/subscription";
import { initiatePayment } from "../../api/payment";
import { getSubscriptionMessage } from '../../utils/subscriptions';
import LoadingState from '../../components/patient-report/LoadingState';
const PLAN_PRICES = { Basic: 200, Pro: 350 };
const MONTHS_OPTIONS = [1, 3, 6, 12];
const Subscriptions = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const redirectedDueToExpiry = searchParams.get("expired") === "1";
    const redirectedDueToUpgrade = searchParams.get("upgrade") === "1";

    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedPlan, setSelectedPlan] = useState(redirectedDueToUpgrade ? "Pro" : "Basic");
    const [selectedMonths, setSelectedMonths] = useState(1);
    const [payLoading, setPayLoading] = useState(false);
    const [payError, setPayError] = useState(null);

    const handleUpgrade = async () => {
        try {
            setPayLoading(true);
            setPayError(null);
            const res = await initiatePayment(selectedPlan, selectedMonths);
            // Redirect the doctor to the Paymob checkout page to complete payment
            window.location.href = res.data.paymentUrl;
        } catch (err) {
            console.error(err);
            setPayError(
                err.response?.data?.message || "Failed to start payment, please try again"
            );
            setPayLoading(false);
        }
    };

    const fetchSubscription = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await getMySubscription();
            setSubscription(res.data);

        } catch (err) {
            console.error(err);
            setError("Failed to load subscription. Please try again.");
        } finally {
            setLoading(false);
        }
    };


useEffect(()=>{
    fetchSubscription()
},[])
    if (loading) return <LoadingState></LoadingState>;
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">

                    <h2 className="text-2xl font-bold text-red-600 mb-3">
                        Oops!
                    </h2>

                    <p className="text-gray-600 mb-6">
                        {error}
                    </p>

                    <button
                        onClick={fetchSubscription}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
                        >
                        Retry
                    </button>

                </div>
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="text-center mt-20">
                <h2 className="text-2xl font-semibold">
                    No Subscription Found
                </h2>
            </div>
        );
    }
    const statusInfo = getSubscriptionMessage(subscription);
    const expireDate =
  subscription.status === "trial"
    ? subscription.trialEnd
    : subscription.subscriptionEnd;

    const progress =
  subscription.status === "trial"
    ? (subscription.daysLeft / 14) * 100
    : Math.min((subscription.daysLeft / 30) * 100, 100);
    return (
        <div className="max-w-5xl mx-auto mt-10 rounded-2xl bg-white shadow-lg p-10">

            {redirectedDueToExpiry && (
                <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
                    You were redirected here because your subscription has expired.
                    Please renew below to continue using MedAgents.
                </div>
            )}

            {redirectedDueToUpgrade && (
                <div className="mb-6 rounded-lg bg-purple-50 border border-purple-200 p-4 text-purple-700 text-sm">
                    This feature (AI Chat / Drug Safety) is available on the <strong>Pro</strong> plan only.
                    Upgrade below to unlock it.
                </div>
            )}

            <div className="flex justify-between items-center">

                <h1 className="text-3xl font-bold">
                    My Subscription
                </h1>

            <span
  className={`px-4 py-1 rounded-full font-semibold ${
    subscription.status === "active"
      ? "bg-green-100 text-green-700"
      : subscription.status === "expired"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700"
  }`}
>
  {subscription.status === "active"
    ? "Premium"
    : subscription.status === "expired"
    ? "Expired"
    : "Trial"}
</span>

            </div>

            <div className="grid grid-cols-3 gap-6 mt-8">

                <div>
                    <p className="text-gray-500">Plan</p>
                    <h2 className="text-3xl font-bold">{subscription.plan}</h2>
                </div>

                <div>
                    <p className="text-gray-500">Days Left</p>
                    <h2 className="text-3xl font-bold">{subscription.daysLeft}</h2>
                </div>

                <div>
                    <p className="text-gray-500">Expire Date</p>
                    <h2 className="text-xl font-semibold">
                        {new Date(expireDate).toLocaleDateString()}
                    </h2>
                </div>

            </div>

            <div className="mt-8">
                <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            <div
                className={`mt-8 rounded-xl border-l-4 p-5 ${statusInfo.bg} ${statusInfo.border}`}
            >
                <h3 className={`font-semibold text-lg ${statusInfo.titleColor}`}>
                    {t(statusInfo.titleKey)}
                </h3>

                <p className="text-gray-600 mt-2">
                    {t(statusInfo.messageKey)}
                </p>
            </div>

            <div className="mt-8 rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-lg text-gray-800 mb-4">
                    {subscription.status === "active" ? "Renew Subscription" : "Subscribe Now"}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Plan</label>
                        <select
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                            <option value="Basic">Basic - {PLAN_PRICES.Basic} EGP / month</option>
                            <option value="Pro">Pro - {PLAN_PRICES.Pro} EGP / month</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Duration</label>
                        <select
                            value={selectedMonths}
                            onChange={(e) => setSelectedMonths(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                            {MONTHS_OPTIONS.map((m) => (
                                <option key={m} value={m}>
                                    {m === 1 ? "1 month" : `${m} months`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleUpgrade}
                        disabled={payLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg transition font-semibold"
                    >
                        {payLoading
                            ? "Redirecting..."
                            : `Pay ${PLAN_PRICES[selectedPlan] * selectedMonths} EGP`}
                    </button>
                </div>

                {payError && (
                    <p className="text-red-600 text-sm mt-3">{payError}</p>
                )}
            </div>

        </div>
    );

}

export default Subscriptions