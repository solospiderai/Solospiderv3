import { toast } from "sonner";
import { recordReferralCommission } from "@/lib/affiliate-tracking";

// Dynamically inject Razorpay Checkout SDK Script
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface RazorpayCheckoutParams {
  planId: "growth" | "scale";
  userEmail?: string;
  couponCode?: string;
  onSuccess?: () => void;
}

export async function triggerRazorpayCheckout({ planId, userEmail, couponCode, onSuccess }: RazorpayCheckoutParams) {
  const toastId = toast.loading("Initializing secure checkout session...");

  try {
    // 1. Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      toast.dismiss(toastId);
      toast.error("Failed to load payment gateway script. Please check your internet connection.");
      return;
    }

    // 2. Request backend to create Razorpay order
    const res = await fetch("/api/checkout/razorpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, couponCode, email: userEmail }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Order generation failed");
    }

    const orderData = await res.json();
    toast.dismiss(toastId);

    // 3. Configure Checkout Options
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Solo Spider AI",
      description: `Upgrade to ${planId.toUpperCase()} Subscription`,
      order_id: orderData.orderId,
      prefill: {
        email: userEmail || "",
      },
      theme: {
        color: "#9025F2",
      },
      handler: async function (response: any) {
        const verifyId = toast.loading("Verifying payment transaction signature...");
        try {
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              email: userEmail,
            }),
          });

          if (!verifyRes.ok) {
            throw new Error("Signature verification failed");
          }

          // Record referral commission if referred
          try {
            recordReferralCommission(planId, userEmail);
          } catch (affErr) {
            console.error("Failed to attribute referral commission:", affErr);
          }

          toast.dismiss(verifyId);
          toast.success(`Successfully upgraded to the ${planId.toUpperCase()} plan!`);
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.reload();
          }
        } catch (err: any) {
          toast.dismiss(verifyId);
          toast.error("Payment verification failed. Please contact support.");
        }
      },
      modal: {
        ondismiss: function () {
          toast.info("Checkout payment session dismissed.");
        },
      },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
  } catch (error: any) {
    toast.dismiss(toastId);
    toast.error(error.message || "Could not launch Razorpay checkout.");
  }
}
