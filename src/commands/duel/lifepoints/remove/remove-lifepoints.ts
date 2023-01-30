import { injectable } from "inversify";
import { ILeafCommand } from "../../../../internal/commands/command";
import { CommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";

@injectable()
export class RemoveLifepoints implements ILeafCommand {
  readonly TRIGGER = "remove";

  buildSchema(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.TRIGGER)
      .setDescription("Remove lp");
  }
  async run(context: CommandInteraction): Promise<void> {
    // TODO :: Implement me !
    return Promise.resolve(undefined);
  }
}
