// Note : Maybe proxy this interface to remove any ref to dJS ?
import { CommandInteraction } from "discord.js";

/** Error thrown when a given command isn't found by the bot */
export class CommandNotFoundError extends Error {}

export interface ICommandMatcher {
  /**
   * Attempt to run a command identified by its trigger *command*, throws CommandNotFoundException if not found
   * @param command
   * @param context
   */
  run(command: string, context: CommandInteraction): Promise<void>;

  /**
   * Publish all registered commands to Discord API
   * @param serverId
   */
  publishCommands(serverId?: `${bigint}`): Promise<void>;
}
