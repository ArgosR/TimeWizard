import { inject, injectable, multiInject, named } from "inversify";
import { ILeafCommand, INodeCommand } from "../../../internal/commands/command";
import { COMMANDS_TAGS, TYPES } from "../../../types";
import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";
import { ILogger } from "../../../pkg/logger/logger-api";

@injectable()
export class NodeDuelLifepoints implements INodeCommand {
  readonly TRIGGER = "lp";

  constructor(
    @multiInject(TYPES.CommandLeaf)
    @named(COMMANDS_TAGS.SubLpDuel)
    private subCommands: ILeafCommand[],
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  buildSchema(): SlashCommandSubcommandGroupBuilder {
    const builder = new SlashCommandSubcommandGroupBuilder()
      .setName(this.TRIGGER)
      .setDescription("Edit the lifepoints to a duel");
    this.subCommands.forEach((sc) => builder.addSubcommand(sc.buildSchema()));
    return builder;
  }

  async run(context: ChatInputCommandInteraction): Promise<void> {
    // At there is only one nested command possible, we are trying to execute a leaf command
    const leafName = context.options.getSubcommand();
    const sc = this.subCommands.find((c) => c.TRIGGER === leafName);
    await sc.run(context);
  }
}
