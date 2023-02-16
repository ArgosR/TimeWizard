import { inject, injectable } from "inversify";
import { ILeafCommand } from "../../../internal/commands/command";
import { TYPES } from "../../../types";
import { ILogger } from "../../../pkg/logger/logger-api";
import { IDuelManager } from "../../../pkg/duel-manager/duel-manager.api";
import { CommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { DuelState } from "../../../pkg/duel-manager/model/duel";

@injectable()
export class PauseDuel implements ILeafCommand {
  readonly TRIGGER = "pause";

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    /** Create and update duels */
    @inject(TYPES.DuelManager) private duelMgr: IDuelManager
  ) {}

  buildSchema(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.TRIGGER)
      .setDescription("Met en pause/remet le duel")
      .addUserOption((p) =>
        p.setName("joueur").setDescription("joueur participant au duel")
      );
  }

  async run(context: CommandInteraction): Promise<void> {
    await context.deferReply();
    //si l'option a été remplie, alors on récupère le joueur en paramètre
    const player = await context.options.getUser("joueur");
    //this.logger.debug(`ID PLAYER ${player?.id} ${player?.username} `);
    const playerId = player?.id ?? context.user.id;

    //on récupère les duels avec ce joueur
    const liste_duel = await this.duelMgr.getFor(playerId);

    if (liste_duel.length != 0) {
      const duel_enc = liste_duel[0];

      switch (duel_enc.state) {
        case DuelState.PAUSED:
          {
            //on attribue la valeur PLAYING  à l'état du duel
            duel_enc.state = DuelState.PLAYING;
            // On met à jour le duel
            await this.duelMgr.save(duel_enc);
            //on notifie
            if (player == null) {
              await context.editReply(`Ton duel est relancé.`);
              context.deleteReply();
              this.logger.debug(`Le duel du lanceur est relancé.`);
            } else {
              await context.editReply(`Le duel de ${player} est relancé.`);
              context.deleteReply();
              this.logger.debug(`Le duel de ${player} est relancé.`);
            }
          }
          break;

        case DuelState.PLAYING:
          {
            //on attribue la valeur PAUSED  à l'état du duel
            duel_enc.state = DuelState.PAUSED;
            // On met à jour le duel
            await this.duelMgr.save(duel_enc);
            //on notifie
            if (player == null) {
              await context.editReply(`Ton duel est en pause.`);
              this.logger.debug(`Le duel du lanceur est en pause.`);
            } else {
              await context.editReply(`Le duel de ${player} est en pause.`);
              this.logger.debug(`Le duel de ${player} est en pause.`);
            }
          }
          break;
      }
    } else {
      if (player == null) {
        await context.editReply(`Tu n'as pas de duel en cours.`);
      } else {
        await context.editReply(`${player} n'as pas de duel en cours.`);
      }
      return;
    }
  }
}
