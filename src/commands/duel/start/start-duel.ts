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
      )
      .addNumberOption((t) =>
        t.setName("time").setDescription("Time for the duel in minutes")
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

    const temps = (await context.options.getNumber("time")) ?? 50; // 50MIN par défaut
    this.logger.debug(`Temps reçu par la commande ${temps}`);
    const duel: IDuel = {
      players: [
        { id: first.id, lp: 8000 },
        { id: second.id, lp: 8000 },
      ],
      state: DuelState.PLAYING,
      channelId: context.channel.id,
      timeLeft: temps * 60,
      notifyAt: [(temps / 2) * 60, (temps / 10) * 60], //par défaut, on notifie a 25min et 5min
    };
    await this.duelMgr.save(duel);
    this.logger.debug(
      `Duel démarré entre ${first.username} et ${second.username} ; Etat du duel : ${duel.state} ; temps : ${duel.timeLeft}
      ${duel.notifyAt[0]} ;${duel.notifyAt[1]}`
    );
    //permet d'aligner le score et les pseudos

    const maxCHAR = 10;
    let pseudal1 = first.username;
    //let pseudal1 = "ps";
    if (pseudal1.length > maxCHAR) {
      pseudal1 = pseudal1.slice(0, maxCHAR - 3);
      pseudal1 = pseudal1 + "[.]";
    }

    pseudal1 = pseudal1.padStart(maxCHAR, " ");

    await context.editReply(`Duel lancé !
\u2800${pseudal1}\t|\t${second.username}`);
  }
}
