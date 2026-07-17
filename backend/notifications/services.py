from .models import Notification

class NotificationService:
  @staticmethod
  def send_order_update_notification(order):
    title = f"Order #{order.id} Status Update"
    message = f"Your order status has transitioned to: {order.get_status_display()}."
    if order.delivery_eta:
      message += f" Estimated delivery: {order.delivery_eta}."

    # Create Database Audit record
    Notification.objects.create(
      user=order.user,
      title=title,
      message=message,
      notification_type='ORDER_STATUS'
    )

    # Console Logging Adapter output
    print("\n" + "*"*60)
    print(f" [NOTIFICATION SERVICE DISPATCH] TO: {order.user.email}")
    print(f" TITLE: {title}")
    print(f" BODY: {message}")
    print("*"*60 + "\n")
    return True

  @staticmethod
  def send_otp_notification(user, code):
    title = "Authentication Verification Code"
    message = f"Your login verification code is: {code}. It is valid for 5 minutes."

    # Create Database Audit record
    Notification.objects.create(
      user=user,
      title=title,
      message=message,
      notification_type='OTP'
    )

    # Console Logging Adapter output
    print("\n" + "*"*60)
    print(f" [NOTIFICATION SERVICE DISPATCH] TO: {user.email}")
    print(f" TITLE: {title}")
    print(f" BODY: {message}")
    print("*"*60 + "\n")
    return True
