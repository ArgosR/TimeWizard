/**
 * Command Dispatcher. Checks if a commands exists from a CommandInteraction
 * Note : REST and Client are both Djs types. I didn't bother to proxy them away as I can't make a
 * framework-agnostic approach without a lot of boilerplate.
 */
import { IRootCommand } from "../../internal/commands/command";
import { inject, injectable, multiInject } from "inversify";
import { TYPES } from "../../types";
import { CommandNotFoundError } from "./command-matcher-api";
import { Client, CommandInteraction } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

@injectable()
export class CommandMatcher {
  constructor(
    @multiInject(TYPES.CommandRoot)
    private commands: IRootCommand[],
    @inject(TYPES.DiscordClientProvider)
    private clientProvider: () => Promise<Client>,
    @inject(TYPES.DiscordRestApi)
    private rest: Partial<REST>
  ) {}

  /**
   * Execute the given
   * @param command
   * @param context
   * @returns
   */
  async run(command: string, context: CommandInteraction): Promise<void> {
    const match = this.commands.find((c) => c.TRIGGER === command);
    if (!match)
      throw new CommandNotFoundError(`No commands with trigger : ${command}`);
    return await match.run(context);
  }

  /**
   * Declare all commands to Discord API.
   * @see https://discord.com/developers/docs/interactions/slash-commands
   * @private
   */
  async publishCommands(serverId?: `${bigint}`): Promise<void> {
    const client = await this.clientProvider();
    const rest = this.rest.setToken(client.token);
    const cDefs = this.commands.flatMap((c) => c.buildSchema());
    if (serverId) {
      await rest.put(
        Routes.applicationGuildCommands(client.application.id, serverId),
        { body: cDefs }
      );
    } else {
      await rest.put(Routes.applicationCommands(client.application.id), {
        body: cDefs,
      });
    }
  }
}
