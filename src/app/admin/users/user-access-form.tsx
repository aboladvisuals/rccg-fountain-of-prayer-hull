"use client";

import { FormEvent, useState, useTransition } from "react";
import { updateMembershipAccess } from "./actions";

type Role = "member" | "pastor" | "admin" | "media";
type Status = "active" | "inactive";

export default function UserAccessForm({
  membershipId,
  initialRole,
  initialStatus,
  userName,
  isCurrentUser,
}: {
  membershipId: string;
  initialRole: Role;
  initialStatus: Status;
  userName: string;
  isCurrentUser: boolean;
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [status, setStatus] = useState<Status>(initialStatus);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    role !== initialRole || status !== initialStatus;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setMessageType("");

    if (!hasChanges) {
      setMessage("No changes were made.");
      setMessageType("success");
      return;
    }

    const roleChanged = role !== initialRole;
    const statusChanged = status !== initialStatus;

    const details = [
      roleChanged ? `role: ${initialRole} → ${role}` : null,
      statusChanged ? `status: ${initialStatus} → ${status}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    const confirmed = window.confirm(
      `Update access for ${userName}?\n\n${details}`
    );

    if (!confirmed) return;

    const formData = new FormData();
    formData.set("membershipId", membershipId);
    formData.set("role", role);
    formData.set("status", status);

    startTransition(async () => {
      const result = await updateMembershipAccess(formData);

      setMessage(result.message);
      setMessageType(result.ok ? "success" : "error");

      if (!result.ok) {
        setRole(initialRole);
        setStatus(initialStatus);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`role-${membershipId}`}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Role
          </label>

          <select
            id={`role-${membershipId}`}
            value={role}
            disabled={isPending}
            onChange={(event) =>
              setRole(event.target.value as Role)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-purple-600 disabled:bg-slate-50"
          >
            <option value="member">Member</option>
            <option value="pastor">Pastor</option>
            <option value="media">Media</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`status-${membershipId}`}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Membership status
          </label>

          <select
            id={`status-${membershipId}`}
            value={status}
            disabled={isPending}
            onChange={(event) =>
              setStatus(event.target.value as Status)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-purple-600 disabled:bg-slate-50"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {isCurrentUser && (
        <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
          This is your account. The database will prevent you from removing
          the final active administrator.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !hasChanges}
        className="rounded-xl bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Updating..." : "Save access changes"}
      </button>

      {message && (
        <p
          role={messageType === "error" ? "alert" : "status"}
          className={
            messageType === "error"
              ? "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              : "rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          }
        >
          {message}
        </p>
      )}
    </form>
  );
}