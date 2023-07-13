import React from "react";

import type { ParsedConfig } from "shared/configSchema";
import { useIpcFirst } from "ui/lib/useIpcFirst";
import { useIpcCall } from "ui/lib/useIpcCall";
import { SettingsForm } from "./SettingsForm";
import { useToaster } from "ui/lib/Toaster";

export const SettingsPage: React.FC = () => {
  const settings = useIpcFirst("config:read", undefined);
  const appInfo = useIpcFirst("app:info", undefined);
  const [updateReq, update] = useIpcCall("config:update");
  const toaster = useToaster();

  React.useEffect(() => {
    if (updateReq.called && updateReq.loading) {
      toaster.add({
        message: "Settings saved",
        duration: 2000,
        type: "success",
      });
    }
  }, [updateReq.called && updateReq.loading]);

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
    <>
      <SettingsForm
        settings={settings.latest}
        saving={updateReq.loading}
        onSubmit={onSubmit}
      />
      {"latest" in appInfo && (
        <p className="p-2">
          This is localgnome version {appInfo.latest.version}
          {!appInfo.latest.distributable ? " (dev)" : ""}. For help please file
          an issue on <a href="https://github.com/spalger/localgnome">github</a>
          .
        </p>
      )}
    </>
  );
};
