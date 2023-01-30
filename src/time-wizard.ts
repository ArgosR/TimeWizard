import { inject, injectable, multiInject } from "inversify";
import { TYPES } from "./types";
import { Client, Interaction, InteractionType } from "discord.js";
import {
  CommandNotFoundError,
  ICommandMatcher,
} from "./pkg/command-matcher/command-matcher-api";
import { ILogger } from "./pkg/logger/logger-api";
import { ICoroutine } from "./internal/coroutines/coroutune-api";

@injectable()
export class TimeWizard {
  private client: Client;

  constructor(
    /** Discord client */
    @inject(TYPES.DiscordClientProvider)
    private clientProvider: () => Promise<Client>,

    /** coroutines */
    @multiInject(TYPES.Coroutine) private coroutines: ICoroutine[],
    /** Command matcher */
    @inject(TYPES.CommandMatcher) private matcher: ICommandMatcher,
    /** Logger */
    @inject(TYPES.Logger) private logger: ILogger
  ) {}

  async bootUp(): Promise<void> {
    this.client = await this.clientProvider();
    void this.startCoroutines();
    try {
      let pubServer = process.env.PUBLISH_COMMANDS_ONLY_TO;
      if (pubServer === "") pubServer = undefined;
      await this.matcher.publishCommands(pubServer as `${bigint}`);
    } catch (e) {
      this.logger.warn("Couldn't publish slash commands ! Error", { err: e });
    }
    this.client.on("interactionCreate", (i) => this.runCommand(i));
  }

  /**
   * Start all coroutines, setting up all the required subscription and
   * starts the event broker
   */
  async startCoroutines(): Promise<void> {
    try {
      await Promise.all(this.coroutines.map((c) => c.start()));
    } catch (e) {
      this.logger.error(`Coroutine exited : ${e}`);
    }
  }

  /**
   * Attempt to execute a command
   * @param interaction
   */
  async runCommand(interaction: Interaction): Promise<void> {
    if (interaction.type !== InteractionType.ApplicationCommand) return;
    try {
      await this.matcher.run(interaction.commandName, interaction);
    } catch (e) {
      //TODO : This has to catch every possible error
      switch (e.constructor.name) {
        case CommandNotFoundError:
          this.logger.warn(
            `Failed to execute command ${
              interaction.commandName
            } as it doesn't exists. Interaction payload : ${interaction.toString()}`
          );
          // Can you really invoke a non-existing slash command
          // without invoking the API itself ?
          await interaction.reply("This command does not exists !");
          break;
        default:
          this.logger.error(
            `Unhandled error while executing interaction ${
              interaction.commandName
            }. Interaction ${interaction.toString()}}`,
            { err: e }
          );
          await interaction.followUp(`Something unexpected happened !`);
          break;
      }
    }
  }
}
