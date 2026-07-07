import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPaymentStatus } from "../../api/payment";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15; // roughly 30 seconds of waiting

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const attemptsRef = useRef(0);

  const [status, setStatus] = useState("checking"); // checking | success | failed | timeout
  const [details, setDetails] = useState(null);

  const merchantOrderId = searchParams.get("merchant_order_id");

  useEffect(() => {
    if (!merchantOrderId) {
      setStatus("failed");
      return;
    }

    let timer;

    const poll = async () => {
      try {
        const res = await getPaymentStatus(merchantOrderId);
        const paymentStatus = res.data.status;

        if (paymentStatus === "success") {
          setStatus("success");
          setDetails(res.data);
          return;
        }

        if (paymentStatus === "failed") {
          setStatus("failed");
          return;
        }

        // still pending - the webhook may take a few seconds to arrive
        attemptsRef.current += 1;
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setStatus("timeout");
          return;
        }

        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        console.error(err);
        setStatus("failed");
      }
    };

    poll();

    return () => clearTimeout(timer);
  }, [merchantOrderId]);

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full">

        {status === "checking" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <h2 className="text-xl font-bold text-gray-800">
              Confirming your payment...
            </h2>
            <p className="text-gray-500 mt-2">
              This may take a few seconds, please don't close this page
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Payment Successful 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              Your subscription has been activated on the {details?.plan} plan for {details?.months} month(s)
            </p>
            <button
              onClick={() => navigate("/subscriptions")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
            >
              Back to Subscription
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-6">
              Something went wrong during the payment, please try again
            </p>
            <button
              onClick={() => navigate("/subscriptions")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
            >
              Try Again
            </button>
          </>
        )}

        {status === "timeout" && (
          <>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">
              Still Confirming
            </h2>
            <p className="text-gray-600 mb-6">
              The payment went through, but confirmation is taking a bit longer than usual. Check the subscription page again in a minute.
            </p>
            <button
              onClick={() => navigate("/subscriptions")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
            >
              Back to Subscription
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default PaymentCallback;