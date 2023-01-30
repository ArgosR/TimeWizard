import {
  ICommand,
  ILeafCommand,
  INodeCommand,
  IRootCommand,
} from "../../internal/commands/command";
import { inject, injectable, multiInject, named, optional } from "inversify";
import {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
} from "discord.js";
import { COMMANDS_TAGS, TYPES } from "../../types";
import { ILogger } from "../../pkg/logger/logger-api";

@injectable()
export class MainDuel implements IRootCommand {
  readonly TRIGGER = "duel";

  constructor(
    @multiInject(TYPES.CommandLeaf)
    @named(COMMANDS_TAGS.SubDuel)
    private subCommandLeafs: ILeafCommand[],
    @multiInject(TYPES.CommandNode)
    @optional()
    @named(COMMANDS_TAGS.SubDuel)
    private subCommandNodes: INodeCommand[] = [],
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  buildSchema(): RESTPostAPIChatInputApplicationCommandsJSONBody {
    const builder = new SlashCommandBuilder()
      .setName(this.TRIGGER)
      .setDescription("All commands related to a duel");
    this.subCommandNodes.forEach((sc) =>
      builder.addSubcommandGroup(sc.buildSchema())
    );
    this.subCommandLeafs.forEach((sc) =>
      builder.addSubcommand(sc.buildSchema())
    );
    return builder.toJSON();
  }

  async run(context: ChatInputCommandInteraction): Promise<void> {
    const group = context.options.getSubcommandGroup();
    let sc: ICommand;
    // At this point in the command tree, we can either be trying to execute a node command
    // or a leaf command
    // If the subcommand group is defined, it's a node
    if (group !== null) {
      sc = this.subCommandNodes.find((c) => c.TRIGGER === group);
    }
    // If not, it's a leaf
    else {
      const leafName = context.options.getSubcommand();
      sc = this.subCommandLeafs.find((c) => c.TRIGGER === leafName);
    }

    await sc.run(context);
  }
}
