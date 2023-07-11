import { Handlers } from "./types";

import { AppInfoHandler } from "./app";
import { ConfigReadHandler, ConfigUpdateHandler } from "./config";
import { RepoListHandler } from "./repo list";
import {
  RepoSwitchToMainHandler,
  RepoPullMainHandler,
  RepoSaveChangesHandler,
  RepoStashChangesHandler,
} from "./repo";

export const IpcHandlers: Handlers = {
  "app:info": AppInfoHandler,
  "config:read": ConfigReadHandler,
  "config:update": ConfigUpdateHandler,
  "repo list": RepoListHandler,
  "repo:switchToMain": RepoSwitchToMainHandler,
  "repo:pullMain": RepoPullMainHandler,
  "repo:saveChanges": RepoSaveChangesHandler,
  "repo:stashChanges": RepoStashChangesHandler,
};
