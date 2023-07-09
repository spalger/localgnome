import React from "react";
import { useForm } from "react-hook-form";

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
      <div>
        <label>Repos dir</label>
        <input
          type="text"
          {...register("reposDir", { disabled: props.saving })}
        />
      </div>
      <div>
        <button type="submit" disabled={props.saving}>
          Save
        </button>
      </div>
    </form>
  );
};
