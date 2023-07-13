import { Handlers } from "./types";

import { AppInfoHandler } from "./app";
import { ConfigReadHandler, ConfigUpdateHandler } from "./config";
import { ReposListHandler, ReposRefreshHandler } from "./repos";
import {
  RepoSwitchToMainHandler,
  RepoPullMainHandler,
  RepoSaveChangesHandler,
  RepoStashChangesHandler,
  RepoOpenHandler,
} from "./repo";

export const IpcHandlers: Handlers = {
  "app:info": AppInfoHandler,
  "config:read": ConfigReadHandler,
  "config:update": ConfigUpdateHandler,
  "repos:list": ReposListHandler,
  "repos:refresh": ReposRefreshHandler,
  "repo:switchToMain": RepoSwitchToMainHandler,
  "repo:pullMain": RepoPullMainHandler,
  "repo:saveChanges": RepoSaveChangesHandler,
  "repo:stashChanges": RepoStashChangesHandler,
  "repo:open": RepoOpenHandler,
};
