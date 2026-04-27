"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";
import { getPusherConfig } from "@/lib/pusher-notifications";

interface PusherNotificationPayload {
  type?: string;
  title?: string;
  message?: string;
  pid?: number | string | null;
  notification_id?: number | string | null;
  taskId?: number | string | null;
  priority?: string | number | null;
}

const notificationRefreshEventName = "pi360:notifications:refresh";

export function dispatchNotificationRefresh(payload?: PusherNotificationPayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(notificationRefreshEventName, {
      detail: payload ?? null,
    }),
  );
}

export function subscribeToNotificationRefresh(
  handler: (payload: PusherNotificationPayload | null) => void,
) {
  const listener = (event: Event) => {
    handler((event as CustomEvent<PusherNotificationPayload | null>).detail ?? null);
  };

  window.addEventListener(notificationRefreshEventName, listener);

  return () => {
    window.removeEventListener(notificationRefreshEventName, listener);
  };
}

export default function PusherNotifications() {
  const router = useRouter();
  const [toasts, setToasts] = useState<Array<PusherNotificationPayload & { id: string }>>([]);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializePusher = async () => {
      try {
        const config = await getPusherConfig();
        if (!isMounted || !config) {
          return;
        }

        const token = localStorage.getItem("authToken") ?? "";
        const pusher = new Pusher(config.key, {
          cluster: config.cluster,
          forceTLS: true,
          channelAuthorization: {
            endpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}/../lawyer_apis/pusher_auth.php`,
            transport: "ajax",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          },
        });

        pusherRef.current = pusher;

        const handleNotification = (payload: PusherNotificationPayload) => {
          dispatchNotificationRefresh(payload);

          setToasts((current) => [
            ...current.slice(-2),
            {
              ...payload,
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            },
          ]);

          if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted" &&
            document.hidden
          ) {
            const notification = new Notification(payload.title || "New notification", {
              body: payload.message || "",
            });

            notification.onclick = () => {
              window.focus();
              if (payload.taskId) {
                router.push("/lawyer-notifications");
              }
            };
          }
        };

        const emrChannel = pusher.subscribe("emr-channel");
        emrChannel.bind("new-notification", handleNotification);

        if (config.userId) {
          const privateChannel = pusher.subscribe(`private-lawyer-${config.userId}`);
          privateChannel.bind("new-notification", handleNotification);
        }

        if (typeof Notification !== "undefined" && Notification.permission === "default") {
          void Notification.requestPermission();
        }
      } catch (error) {
        console.error("Failed to initialize Pusher notifications:", error);
      }
    };

    void initializePusher();

    return () => {
      isMounted = false;
      pusherRef.current?.disconnect();
      pusherRef.current = null;
    };
  }, [router]);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 10000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-wrap">
      {toasts.map((toast) => (
        <div
          className="toast"
          key={toast.id}
          role="button"
          tabIndex={0}
          onClick={() => router.push("/lawyer-notifications")}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              router.push("/lawyer-notifications");
            }
          }}
        >
          <button
            className="toast-x"
            type="button"
            aria-label="Dismiss notification"
            onClick={(event) => {
              event.stopPropagation();
              setToasts((current) => current.filter((item) => item.id !== toast.id));
            }}
          >
            {"\u00D7"}
          </button>
          <div className="t">{toast.title || "New notification"}</div>
          <div className="m">{toast.message || ""}</div>
        </div>
      ))}
    </div>
  );
}
