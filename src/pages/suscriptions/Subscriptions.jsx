import React from 'react'
import { useEffect, useState } from "react";
import { getMySubscription } from "../../api/subscription";
import { getSubscriptionMessage } from '../../utils/subscriptions';
const Subscriptions = () => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
    if (loading) return <h2>Loading...</h2>;
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

            <div className="flex justify-between items-center">

                <h1 className="text-3xl font-bold">
                    My Subscription
                </h1>

            <span
  className={`px-4 py-1 rounded-full font-semibold ${
    subscription.status === "active"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700"
  }`}
>
  {subscription.status === "active" ? "Premium" : "Trial"}
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
                    {statusInfo.title}
                </h3>

                <p className="text-gray-600 mt-2">
                    {statusInfo.message}
                </p>
            </div>

        </div>
    );

}

export default Subscriptions
