import { ILeafCommand } from "../../../internal/commands/command";
import { inject, injectable } from "inversify";
import { TYPES } from "../../../types";
import {
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import { IDuelManager } from "../../../pkg/duel-manager/duel-manager.api";
import { ILogger } from "../../../pkg/logger/logger-api";
import { DuelState, IDuel } from "../../../pkg/duel-manager/model/duel";

@injectable()
export class StartDuel implements ILeafCommand {
  readonly TRIGGER = "start";
  buildSchema(): SlashCommandSubcommandBuilder {
    // To start a duel, we gather the two opponents
    return new SlashCommandSubcommandBuilder()
      .setName(this.TRIGGER)
      .setDescription("Starts a new duel instance")
      .addUserOption((p) =>
        p.setName("p1").setDescription("First Player").setRequired(true)
      )
      .addUserOption((p) =>
        p.setName("p2").setDescription("Second Player").setRequired(true)
      );
  }

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    /** Create and update duels */
    @inject(TYPES.DuelManager) private duelMgr: IDuelManager
  ) {}

  async run(context: ChatInputCommandInteraction): Promise<void> {
    // ACK the command first to ensure it doesn't timeout
    await context.deferReply();

    const first = await context.options.getUser("p1");
    const second = await context.options.getUser("p2");

    const isP1Dueling = await this.duelMgr.isDueling(first.id);
    const isP2Dueling = await this.duelMgr.isDueling(second.id);

    if (isP1Dueling || isP2Dueling) {
      await context.editReply(
        `Cannot start a new duel, one of the player is currently involved in another duel !`
      );
      return;
    }

    const duel: IDuel = {
      players: [
        { id: first.id, lp: 8000 },
        { id: second.id, lp: 8000 },
      ],
      state: DuelState.PLAYING,
      channelId: context.channel.id,
      timeLeft: 30 * 60, // 30 minutes
    };
    await this.duelMgr.save(duel);

    await context.editReply(`Duel started !`);
  }
}
