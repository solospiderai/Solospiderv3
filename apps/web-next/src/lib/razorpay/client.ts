import Razorpay from "razorpay";

let instance: InstanceType<typeof Razorpay> | null = null;

export function getRazorpayClient(): InstanceType<typeof Razorpay> {
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ?? "",
      key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
    });
  }
  return instance;
}
