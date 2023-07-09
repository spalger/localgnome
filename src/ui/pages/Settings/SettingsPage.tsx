import React from "react";

import type { ParsedConfig } from "shared/configSchema";
import { useIpcFirst } from "ui/lib/useIpcFirst";
import { useIpcCall } from "ui/lib/useIpcCall";
import { SettingsForm } from "./SettingsForm";

export const SettingsPage: React.FC = () => {
  const settings = useIpcFirst("config:read", undefined);
  const [updateReq, update] = useIpcCall("config:update");

  if (settings.type === "error") {
    throw settings.error;
  }

  if (settings.type === "init") {
    return <div className="m-2">Loading settings...</div>;
  }

  const onSubmit = (newData: ParsedConfig) => {
    const updated = Object.fromEntries(
      Object.entries(newData).filter(([key, value]) => {
        return value !== settings.latest[key as keyof typeof newData];
      })
    );

    if (Object.keys(updated).length) {
      update(updated);
    }
  };

  return (
    <SettingsForm
      settings={settings.latest}
      saving={updateReq.loading}
      onSubmit={onSubmit}
    />
  );
};
