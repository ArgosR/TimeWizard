import { injectable } from "inversify";
import { ILeafCommand } from "../../../../internal/commands/command";
import { CommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";

@injectable()
export class AddLifepoints implements ILeafCommand {
  readonly TRIGGER = "add";

  buildSchema(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.TRIGGER)
      .setDescription("Add lp");
  }
  async run(context: CommandInteraction): Promise<void> {
    // TODO :: Implement me !
    return Promise.resolve(undefined);
  }
}
