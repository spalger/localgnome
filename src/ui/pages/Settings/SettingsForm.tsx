import React from "react";
import { useForm } from "react-hook-form";

import { Button } from "ui/components/Button";
import type { ParsedConfig } from "shared/configSchema";

interface Props {
  settings: ParsedConfig;
  onSubmit: (settings: ParsedConfig) => void;
  saving: boolean;
}

export const SettingsForm: React.FC<Props> = (props) => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      ...props.settings,
    },
  });

  return (
    <form onSubmit={handleSubmit((data) => props.onSubmit(data))}>
      <div className="p-2">
        <label className="text-lg mr-2">Repos dir</label>
        <input
          type="text"
          className="border rounded p-1 w-96"
          {...register("reposDir", { disabled: props.saving })}
        />
      </div>
      <div className="p-2">
        <Button type="submit" disabled={props.saving}>
          Save
        </Button>
      </div>
    </form>
  );
};
