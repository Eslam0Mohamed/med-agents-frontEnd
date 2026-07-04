import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPaymentStatus } from "../../api/payment";

// باي موب بيرجّع الدكتور هنا بعد ما يخلص الدفع (لازم نحط الرابط ده
// في إعدادات الـ iframe بتاعة باي موب كـ "Transaction Response Callback")
// الـ webhook هو اللي فعليًا بيفعّل الاشتراك في الباك إند - الصفحة دي
// بس بتستنى وتعرض النتيجة للدكتور

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15; // حوالي 30 ثانية استنى

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

        // لسه pending - الـ webhook ممكن ياخد كام ثانية يوصل
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
              جاري تأكيد عملية الدفع...
            </h2>
            <p className="text-gray-500 mt-2">
              ممكن تاخد كام ثانية، من فضلك متقفليش الصفحة
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              تم الدفع بنجاح 🎉
            </h2>
            <p className="text-gray-600 mb-6">
              تم تفعيل اشتراكك بخطة {details?.plan} لمدة {details?.months} شهر
            </p>
            <button
              onClick={() => navigate("/subscriptions")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
            >
              رجوع للاشتراك
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              فشلت عملية الدفع
            </h2>
            <p className="text-gray-600 mb-6">
              حصلت مشكلة أثناء الدفع، ممكن تحاول تاني
            </p>
            <button
              onClick={() => navigate("/subscriptions")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
            >
              المحاولة مرة أخرى
            </button>
          </>
        )}

        {status === "timeout" && (
          <>
            <h2 className="text-2xl font-bold text-yellow-600 mb-2">
              العملية لسه بتتأكد
            </h2>
            <p className="text-gray-600 mb-6">
              الدفع وصل بس بناخد شوية وقت في التأكيد. راجع صفحة الاشتراك بعد دقيقة.
            </p>
            <button
              onClick={() => navigate("/subscriptions")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
            >
              رجوع للاشتراك
            </button>
          </>
        )}

      </div>
    </div>
  );
};

export default PaymentCallback;
