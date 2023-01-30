import { inject, injectable } from "inversify";
import { ILeafCommand } from "../../../internal/commands/command";
import { TYPES } from "../../../types";
import { ILogger } from "../../../pkg/logger/logger-api";
import { IDuelManager } from "../../../pkg/duel-manager/duel-manager.api";
import { CommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";

@injectable()
export class EndDuel implements ILeafCommand {
  readonly TRIGGER = "end";

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    /** Create and update duels */
    @inject(TYPES.DuelManager) private duelMgr: IDuelManager
  ) {}

  buildSchema(): SlashCommandSubcommandBuilder {
    return undefined;
  }

  run(context: CommandInteraction): Promise<void> {
    // TODO :: Implement me !
    return Promise.resolve(undefined);
  }
}
