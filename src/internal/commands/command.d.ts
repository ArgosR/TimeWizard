/**
 * Commands definition.
 *
 * In Discord, command are a bit complicated.
 * So, based on the documentation (https://discord.com/developers/docs/interactions/application-commands#subcommands-and-subcommand-groups)
 * We can have the following hierarchy
 * command
 * |
 * |__ subcommand-group
 *     |
 *     |__ subcommand
 *     |__ subcommand
 * |
 * |__ subcommand-group
 *     |
 *     |__ subcommand
 *
 *  In this hierarchy, we can identify :
 *  - a command a tree root
 *  - a subcommand as a tree node
 *  - a subcommand as a tree leaf
 */
import {
  CommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "discord.js";

interface ICommand {
  /** Command name
   * This should be static (hence uppercase), but static attributes cannot be enforced using interfaces
   * */
  readonly TRIGGER: string;

  /**
   * Command schema to publish in Discord API
   */
  buildSchema(): any;

  /**
   * Command handler
   * @param context interaction having triggered the command
   */
  run(context: CommandInteraction): Promise<void>;
}

export interface IRootCommand extends ICommand {
  /**
   * Command schema to publish in Discord API
   */
  buildSchema(): RESTPostAPIChatInputApplicationCommandsJSONBody;
}

export interface INodeCommand extends ICommand {
  /**
   * Command schema to publish in Discord API
   */
  buildSchema(): SlashCommandSubcommandGroupBuilder;
}

export interface ILeafCommand extends ICommand {
  /**
   * Command schema to publish in Discord API
   */
  buildSchema(): SlashCommandSubcommandBuilder;
}
