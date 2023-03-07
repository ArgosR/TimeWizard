import { inject, injectable } from "inversify";
import { ILeafCommand } from "../../../internal/commands/command";
import { TYPES } from "../../../types";
import { ILogger } from "../../../pkg/logger/logger-api";
import { IDuelManager } from "../../../pkg/duel-manager/duel-manager.api";
import { CommandInteraction, SlashCommandSubcommandBuilder } from "discord.js";
import { DuelState } from "../../../pkg/duel-manager/model/duel";

@injectable()
export class ResetDuel implements ILeafCommand {
  readonly TRIGGER = "reset";

  constructor(
    @inject(TYPES.Logger) private logger: ILogger,
    /** Create and update duels */
    @inject(TYPES.DuelManager) private duelMgr: IDuelManager
  ) {}

  buildSchema(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
      .setName(this.TRIGGER)
      .setDescription("Remet les LP des joueurs a 8000 sans toucher au temps")
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

    //this.logger.debug(`début de fonction reset`);
    if (liste_duel.length != 0) {
      const duel_enc = liste_duel[0];

      // si il y a un duel en cours avec le joueur qui lance la commande ou qui est en paramètre
      switch (duel_enc.state) {
        case DuelState.PAUSED:
          {
            //on relance le duel
            duel_enc.state = DuelState.PLAYING;
            duel_enc.players.forEach((p) => (p.lp = 8000));
            // On met à jour le duel
            await this.duelMgr.save(duel_enc);
            //on notifie
            if (player == null) {
              await context.editReply(
                `Ton duel est relancé et LP remis à 8000|8000.`
              );
              //context.deleteReply();
              this.logger.debug(
                `Le duel du lanceur est relancé et LP remis à 8000|8000.`
              );
            } else {
              await context.editReply(
                `Le duel de ${player} est relancé et LP remis à 8000|8000.`
              );
              //context.deleteReply();
              this.logger.debug(
                `Le duel de ${player} est relancé et LP remis à 8000|8000.`
              );
            }
          }
          break;

        case DuelState.PLAYING:
          {
            duel_enc.players.forEach((p) => (p.lp = 8000));
            // On met à jour le duel
            await this.duelMgr.save(duel_enc);
            //on notifie
            if (player == null) {
              await context.editReply(
                `Ton duel est relancé et LP remis à 8000|8000.`
              );
              //context.deleteReply();
              this.logger.debug(
                `Le duel du lanceur est relancé et LP remis à 8000|8000.`
              );
            } else {
              await context.editReply(
                `Le duel de ${player} est relancé et LP remis à 8000|8000.`
              );
              //context.deleteReply();
              this.logger.debug(
                `Le duel de ${player} est relancé et LP remis à 8000|8000.`
              );
            }
          }
          break;

        default: {
          this.logger.warn(`On a tenté de reset un duel terminé.`);
          await context.editReply(`On a tenté de reset un duel terminé.`);
          break;
        }
      }
    } else {
      if (player == null) {
        await context.editReply(`Tu n'as pas de duel en cours.`);
      } else {
        await context.editReply(`${player} n'as pas de duel en cours.`);
      }
      return;
    }
    //this.logger.debug(`Fin de fonction reset`);
  }
}
